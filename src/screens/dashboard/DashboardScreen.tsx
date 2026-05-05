import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { api } from '../../api/apiHelper';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cashAmount, setCashAmount] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const fromDateUtc = startOfMonth(new Date()).toISOString();
      const toDateUtc = endOfMonth(new Date()).toISOString();

      const [cashBankJson, recentJson, monthJson] = await Promise.all([
        api.post('/transaction/getCashBankAmount'),
        api.post('/transaction/getRecentTransaction', { count: 5 }),
        api.post('/transaction/getTransaction', { fromDate: fromDateUtc, toDate: toDateUtc })
      ]);
      
      if (cashBankJson.success) {
        setCashAmount(cashBankJson.data?.cashAmount || 0);
        setBankAmount(cashBankJson.data?.bankAmount || 0);
      }

      if (recentJson.success) {
        const recentData = Array.isArray(recentJson.data) ? recentJson.data : recentJson.data?.data;
        setRecentTransactions(recentData || []);
      }

      if (monthJson.success) {
        const monthData = Array.isArray(monthJson.data) ? monthJson.data : monthJson.data?.data;
        setMonthlyTransactions(monthData || []);
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const totalBalance = cashAmount + bankAmount;

  const processLineChartData = () => {
    const weeklyData = [0, 0, 0, 0, 0];
    monthlyTransactions.forEach((tx) => {
      // Sum all transactions or just expenses? Let's do all expenses for the trend
      if (tx.transaction_type?.name === 'Debit') {
        const date = new Date(tx.date);
        const week = Math.floor((date.getDate() - 1) / 7);
        if (week >= 0 && week < 5) {
          weeklyData[week] += Number(tx.amount || 0);
        }
      }
    });
    return {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
      datasets: [{ data: weeklyData.some(d => d > 0) ? weeklyData : [0, 0, 0, 0, 0] }]
    };
  };

  const processPieChartData = () => {
    const expensesByCategory: Record<string, number> = {};
    monthlyTransactions.forEach((tx) => {
      if (tx.transaction_type?.name === 'Debit') {
        const cat = tx.category?.name || 'Other';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(tx.amount || 0);
      }
    });

    const colors = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];
    
    const data = Object.keys(expensesByCategory).map((key, index) => ({
      name: key,
      population: expensesByCategory[key],
      color: colors[index % colors.length],
      legendFontColor: 'hsl(240, 3.8%, 46.1%)',
      legendFontSize: 12
    }));

    if (data.length === 0) {
      return [{ name: 'No Data', population: 1, color: 'hsl(240, 4.8%, 95.9%)', legendFontColor: 'hsl(240, 3.8%, 46.1%)', legendFontSize: 12 }];
    }
    return data.sort((a,b) => b.population - a.population).slice(0, 5);
  };

  const lineData = processLineChartData();
  const pieData = processPieChartData();

  const getIconForCategory = (categoryName: string) => {
    const map: any = {
      Groceries: 'cart-outline',
      Food: 'restaurant-outline',
      Medical: 'medkit-outline',
      Entertainment: 'film-outline',
      Salary: 'briefcase-outline',
      Shopping: 'bag-handle-outline',
      Transportation: 'car-outline',
      Utilities: 'flash-outline',
      Fuel: 'water-outline',
      Rent: 'home-outline',
      Loan: 'cash-outline',
      EMI: 'card-outline',
    };
    return map[categoryName] || 'cash-outline';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image 
              source={{ uri: user.avatar.startsWith('http') ? user.avatar : `https://backend-nodejs-pa.vercel.app${user.avatar}` }} 
              style={styles.avatarImage} 
            />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="hsl(262.1, 83.3%, 57.8%)" />
        </View>
      ) : (
        <>
          {/* Charts Section */}
          <View style={styles.section}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                <Ionicons name="trending-up" size={18} color="hsl(262.1, 83.3%, 57.8%)" /> Weekly Expense Trend
              </Text>
              <LineChart
                data={lineData}
                width={screenWidth - 88} // padding
                height={180}
                yAxisLabel="₹"
                chartConfig={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  backgroundGradientFrom: 'hsl(0, 0%, 100%)',
                  backgroundGradientTo: 'hsl(0, 0%, 100%)',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: 'hsl(262.1, 83.3%, 57.8%)' }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                <Ionicons name="pie-chart" size={18} color="hsl(262.1, 83.3%, 57.8%)" /> Expense Distribution
              </Text>
              <PieChart
                data={pieData}
                width={screenWidth - 88}
                height={160}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>
          </View>

          {/* Balance Cards Section */}
          <View style={styles.section}>
            {/* Total Balance */}
            <View style={[styles.balanceCard, { backgroundColor: '#6366f1' }]}>
              <Ionicons name="add-circle" size={100} color="rgba(255,255,255,0.15)" style={styles.cardBgIcon} />
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceValue}>₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.balanceSubRow}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.balanceSubText}>Combined Wealth</Text>
              </View>
            </View>

            {/* Bank Balance */}
            <View style={[styles.balanceCard, { backgroundColor: '#10b981' }]}>
              <Ionicons name="business" size={100} color="rgba(255,255,255,0.15)" style={styles.cardBgIcon} />
              <Text style={styles.balanceLabel}>Bank Balance</Text>
              <Text style={styles.balanceValue}>₹{bankAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.balanceSubRow}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.balanceSubText}>Updated just now</Text>
              </View>
            </View>

            {/* Cash Balance */}
            <View style={[styles.balanceCard, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="cash" size={100} color="rgba(255,255,255,0.15)" style={styles.cardBgIcon} />
              <Text style={styles.balanceLabel}>Cash Balance</Text>
              <Text style={styles.balanceValue}>₹{cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.balanceSubRow}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.balanceSubText}>Updated just now</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="time" size={20} color="hsl(262.1, 83.3%, 57.8%)" />
                </View>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.seeAll}>View all</Text>
                <Ionicons name="trending-up" size={14} color="hsl(262.1, 83.3%, 57.8%)" />
              </TouchableOpacity>
            </View>

            {recentTransactions.map((item) => {
              const isCredit = item.transaction_type?.name === 'Credit';
              const iconColor = isCredit ? '#10b981' : '#ef4444';
              const textColor = isCredit ? '#10b981' : 'hsl(240, 10%, 3.9%)';
              const formattedDate = format(new Date(item.date), 'dd MMM yyyy');

              return (
                <View key={item._id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: iconColor + '22' }]}>
                    <Ionicons name={getIconForCategory(item.category?.name)} size={20} color={iconColor} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{item.description || item.category?.name}</Text>
                    <Text style={styles.activityCat}>{item.category?.name} • {item.payment_type?.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.activityAmount, { color: textColor }]}>
                      {isCredit ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.activityTime}>{formattedDate}</Text>
                  </View>
                </View>
              );
            })}

            {recentTransactions.length === 0 && (
               <Text style={{ textAlign: 'center', color: '#6b7280', marginVertical: 20 }}>No recent activity.</Text>
            )}
          </View>
        </>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  greeting: { fontSize: 14, color: 'hsl(240, 3.8%, 46.1%)' },
  userName: { fontSize: 22, fontWeight: '800', color: 'hsl(240, 10%, 3.9%)', marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: 'hsl(210, 20%, 98%)', fontSize: 18, fontWeight: '700' },
  
  section: { paddingHorizontal: 24, marginBottom: 24 },
  
  chartCard: {
    backgroundColor: 'hsl(0, 0%, 100%)', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: 'hsl(240, 5.9%, 90%)',
    shadowColor: 'hsl(240, 10%, 3.9%)', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)', marginBottom: 16 },
  chartPlaceholder: {
    height: 140,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'hsl(240, 5.9%, 90%)',
  },
  placeholderText: {
    color: 'hsl(240, 3.8%, 46.1%)',
    fontSize: 13,
    marginTop: 8,
  },

  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: 'hsl(240, 10%, 3.9%)', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 3,
  },
  cardBgIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.3,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceSubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    padding: 8,
    backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.1)',
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: { color: 'hsl(262.1, 83.3%, 57.8%)', fontSize: 13, fontWeight: '600' },
  
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'hsl(0, 0%, 100%)', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'hsl(240, 5.9%, 90%)',
    shadowColor: 'hsl(240, 10%, 3.9%)', 
    shadowOpacity: 0.03, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 1,
  },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: 'hsl(240, 10%, 3.9%)', marginBottom: 2 },
  activityCat: { fontSize: 12, color: 'hsl(240, 3.8%, 46.1%)' },
  activityAmount: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  activityTime: { fontSize: 11, color: 'hsl(240, 3.8%, 46.1%)' },
});
