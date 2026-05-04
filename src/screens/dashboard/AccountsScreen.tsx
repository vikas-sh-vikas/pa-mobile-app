import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AccountsScreen() {
  const [formType, setFormType] = useState<string | null>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [cashAmount, setCashAmount] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingBankId, setEditingBankId] = useState('');
  const [bankName, setBankName] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('@ag_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [banksRes, cashRes] = await Promise.all([
        fetch('https://backend-nodejs-pa.vercel.app/api/bank/getBanks', {
          method: 'POST', headers, body: JSON.stringify({}),
        }),
        fetch('https://backend-nodejs-pa.vercel.app/api/transaction/getCashBankAmount', {
          method: 'POST', headers, body: JSON.stringify({}),
        })
      ]);

      const banksJson = await banksRes.json();
      const cashJson = await cashRes.json();

      if (banksJson.success) {
        setBanks(banksJson.data || []);
      }
      if (cashJson.success) {
        setCashAmount(cashJson.data?.cashAmount || 0);
        setBankAmount(cashJson.data?.bankAmount || 0);
      }
    } catch (error) {
      console.log('Error fetching accounts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const toggleForm = (type: string, bankToEdit?: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (formType === type && !bankToEdit) {
      setFormType(null);
    } else {
      setFormType(type);
      if (bankToEdit) {
        setEditingBankId(bankToEdit._id);
        setBankName(bankToEdit.bank_name || '');
        setCurrentBalance(bankToEdit.current_balance?.toString() || '');
        setIfscCode(bankToEdit.ifsc_code || '');
        setBranch(bankToEdit.branch || '');
        setAddress(bankToEdit.address || '');
      } else {
        setEditingBankId('');
        setBankName(''); setCurrentBalance(''); setIfscCode(''); setBranch(''); setAddress('');
      }
    }
  };

  const handleSaveBank = async () => {
    if (!bankName || !currentBalance) return Alert.alert('Error', 'Please fill required fields');

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('@ag_token');
      const payload = {
        _id: editingBankId || "",
        bankName: bankName,
        currentBalance: currentBalance,
        ifcsCode: ifscCode, // The API seems to accept ifcsCode
        branch: branch,
        openingBalance: "0",
        address: address,
        bank_name: bankName, // And also bank_name
        current_balance: currentBalance,
        opening_balance: "0",
        ifsc_code: ifscCode
      };

      const res = await fetch('https://backend-nodejs-pa.vercel.app/api/bank/addEditBanks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', json.message || 'Bank saved successfully');
        toggleForm('');
        fetchData();
      } else {
        Alert.alert('Error', json.message || 'Failed to save bank');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    Alert.alert(
      'Delete Bank',
      'Are you sure you want to delete this bank? This may affect transactions linked to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const token = await AsyncStorage.getItem('@ag_token');
              const response = await fetch('https://backend-nodejs-pa.vercel.app/api/bank/deleteBank', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ _id: id }),
              });
              const json = await response.json();
              if (json.success) {
                Alert.alert('Success', 'Bank deleted');
                fetchData();
              } else {
                Alert.alert('Error', json.message || 'Failed to delete');
              }
            } catch (error) {
              console.log('Error deleting bank:', error);
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Bank & Cash Management</Text>
          <Text style={styles.subtitle}>Manage your accounts and transfers</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity 
            style={[styles.actionBtn, formType === 'BANKFORM' ? styles.actionBtnActive : styles.actionBtnInactive]}
            onPress={() => toggleForm('BANKFORM')}
          >
            <Ionicons name="add" size={18} color={formType === 'BANKFORM' ? '#fff' : 'hsl(240, 3.8%, 46.1%)'} />
            <Text style={[styles.actionBtnText, formType === 'BANKFORM' && { color: '#fff' }]}>Add Bank</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Totals Section */}
      <View style={styles.section}>
        <View style={[styles.totalCard, { backgroundColor: '#6366f1' }]}>
          <Ionicons name="business" size={100} color="rgba(255,255,255,0.15)" style={styles.cardBgIcon} />
          <Text style={styles.totalLabel}>Total Bank Balance</Text>
          <Text style={styles.totalValue}>₹{bankAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </View>

        <View style={[styles.totalCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="wallet" size={100} color="rgba(255,255,255,0.15)" style={styles.cardBgIcon} />
          <Text style={styles.totalLabel}>Total Cash Balance</Text>
          <View style={styles.cashRow}>
            <Text style={styles.totalValue}>₹{cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      {/* Forms Section */}
      {formType === 'BANKFORM' && (
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.closeFormBtn} onPress={() => toggleForm('')}>
            <Ionicons name="close" size={24} color="hsl(240, 3.8%, 46.1%)" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {editingBankId ? 'Edit Bank Account' : 'Add Bank Account'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Chase Bank" value={bankName} onChangeText={setBankName} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Balance (₹)</Text>
            <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={currentBalance} onChangeText={setCurrentBalance} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput style={styles.input} placeholder="e.g. HDFC0001234" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Branch</Text>
            <TextInput style={styles.input} placeholder="e.g. Downtown" value={branch} onChangeText={setBranch} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput style={styles.input} placeholder="e.g. 123 Main St" value={address} onChangeText={setAddress} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveBank} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Account</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Bank List */}
      <View style={styles.section}>
        <View style={styles.listHeader}>
          <Ionicons name="business" size={20} color="hsl(262.1, 83.3%, 57.8%)" />
          <Text style={styles.listTitle}>My Bank Accounts</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="hsl(262.1, 83.3%, 57.8%)" style={{ marginTop: 40 }} />
        ) : (
          banks.map((a) => (
            <TouchableOpacity key={a._id} style={styles.accountCard} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={[styles.accountIcon, { backgroundColor: '#8b5cf622' }]}>
                  <Ionicons name="business-outline" size={22} color="#8b5cf6" />
                </View>
                <View style={styles.accountMeta}>
                  <Text style={styles.accountName}>{a.bank_name}</Text>
                  <Text style={styles.accountBank}>{a.branch || 'Main Branch'} • {a.ifsc_code}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.editAccountBtn} onPress={() => toggleForm('BANKFORM', a)}>
                    <Ionicons name="pencil" size={16} color="hsl(240, 3.8%, 46.1%)" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editAccountBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleDeleteBank(a._id)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={[styles.balanceValue, { color: '#8b5cf6' }]}>
                  ₹{Number(a.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        {!isLoading && banks.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#6b7280', marginVertical: 20 }}>No banks added yet.</Text>
        )}
      </View>

      <View style={{ height: 24 }} />

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="hsl(262.1, 83.3%, 57.8%)" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' },
  
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  headerTextWrap: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: 'hsl(240, 10%, 3.9%)' },
  subtitle: { fontSize: 14, color: 'hsl(240, 3.8%, 46.1%)', marginTop: 4 },
  
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionBtnInactive: {
    backgroundColor: 'hsl(240, 4.8%, 95.9%)', // secondary
    borderColor: 'hsl(240, 5.9%, 90%)',
  },
  actionBtnActive: { 
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', 
    shadowColor: 'hsl(262.1, 83.3%, 57.8%)', 
    shadowOpacity: 0.3 
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'hsl(240, 3.8%, 46.1%)',
  },

  section: { paddingHorizontal: 24, marginBottom: 24 },

  totalCard: {
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
  totalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  totalValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
  },
  cashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editCashBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
  },

  formContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  closeFormBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  formTitle: { fontSize: 18, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)', marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: 'hsl(240, 3.8%, 46.1%)', marginBottom: 6 },
  input: {
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: 'hsl(240, 10%, 3.9%)',
  },

  submitBtn: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(240, 10%, 3.9%)',
  },

  accountCard: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  accountIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  accountMeta: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)' },
  accountBank: { fontSize: 12, color: 'hsl(240, 3.8%, 46.1%)', marginTop: 2 },
  editAccountBtn: { padding: 8, backgroundColor: 'hsl(240, 4.8%, 95.9%)', borderRadius: 10 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'hsl(240, 5.9%, 90%)' },
  balanceLabel: { fontSize: 13, color: 'hsl(240, 3.8%, 46.1%)' },
  balanceValue: { fontSize: 18, fontWeight: '800' },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(240, 10%, 3.9%)',
  },
});
