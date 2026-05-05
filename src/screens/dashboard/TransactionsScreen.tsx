import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../api/apiHelper';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [formType, setFormType] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Dash Details
  const [banks, setBanks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [bankId, setBankId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [toBankId, setToBankId] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const fromDateUtc = startOfMonth(selectedDate).toISOString();
      const toDateUtc = endOfMonth(selectedDate).toISOString();

      const [txJson, dashJson] = await Promise.all([
        api.post('/transaction/getTransaction', { fromDate: fromDateUtc, toDate: toDateUtc }),
        api.post('/users/getUserDashDetail')
      ]);

      if (txJson.success) {
        const txData = Array.isArray(txJson.data) ? txJson.data : txJson.data?.data;
        setTransactions(txData || []);
      }

      if (dashJson.success) {
        const dd = dashJson.data;
        setBanks(dd.banks || []);
        setCategories(dd.categories || []);
        setTransactionTypes(dd.transactionTypes || []);
        setPaymentTypes(dd.paymentTypes || []);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedDate])
  );

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const toggleForm = (type: string, txToEdit?: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (formType === type && !txToEdit) {
      setFormType(null);
      setEditingTxId(null);
    } else {
      setFormType(type);
      if (txToEdit) {
        setEditingTxId(txToEdit._id);
        setAmount(txToEdit.amount?.toString() || '');
        setDescription(txToEdit.description || '');
        setTransactionDate(txToEdit.date || new Date().toISOString());
        setCategoryId(txToEdit.category?._id || txToEdit.category || '');
        setPaymentMethodId(txToEdit.payment_type?._id || txToEdit.paymentMethod || '');
        setTypeId(txToEdit.transaction_type?._id || txToEdit.type || '');
        setBankId(txToEdit.bank?._id || txToEdit.bank || '');
      } else {
        setEditingTxId(null);
        setAmount(''); 
        setDescription(''); 
        setTransactionDate(new Date().toISOString());
        setCategoryId(''); setPaymentMethodId(''); setBankId(''); setTypeId(''); setToBankId('');
      }
    }
  };

  const handleAction = async () => {
    if (!amount) return Alert.alert('Error', 'Please enter an amount');

    setIsSubmitting(true);
    try {
      let endpoint = '';
      let body: any = {};

      if (formType === 'TRANSACTION') {
        endpoint = '/transaction/addEditTransaction';
        body = {
          _id: editingTxId || "",
          date: transactionDate,
          amount,
          description,
          category: categoryId,
          paymentMethod: paymentMethodId,
          bank: bankId || null,
          type: typeId,
          payment_type: paymentMethodId,
          transaction_type: typeId
        };
      } else if (formType === 'DEPOSIT') {
        endpoint = '/transaction/depositCash';
        body = { _id: "", bankId, amount };
      } else if (formType === 'WITHDRAW') {
        endpoint = '/transaction/withdrawCash';
        body = { _id: "", bankId, amount };
      } else if (formType === 'TRANSFER') {
        endpoint = '/transaction/selfTransfer';
        body = { _id: "", amount, fromBankId: bankId, toBankId };
      }

      const json = await api.post(endpoint, body);

      if (json.success) {
        Alert.alert('Success', json.message || 'Operation successful');
        toggleForm('');
        fetchData();
      } else {
        Alert.alert('Error', json.message || 'Something went wrong');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const json = await api.post('/transaction/deleteTransaction', { _id: id });
              if (json.success) {
                Alert.alert('Success', 'Transaction deleted');
                fetchData();
              } else {
                Alert.alert('Error', json.message || 'Failed to delete');
              }
            } catch (error) {
              console.log('Error deleting transaction:', error);
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

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

  const handleDownload = async () => {
    try {
      setIsSubmitting(true);
      const fromDate = startOfMonth(selectedDate).toISOString();
      const toDate = endOfMonth(selectedDate).toISOString();

      const filename = `Transactions_${format(selectedDate, 'MMM_yyyy')}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + filename;

      // Special case: we need the raw response or blob
      const token = await AsyncStorage.getItem('@ag_token');
      const response = await fetch('https://backend-nodejs-pa.vercel.app/api/transaction/exportExcelReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromDate, toDate }),
      });

      if (response.status === 200) {
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        Alert.alert('Error', 'Failed to generate report');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>Transactions History</Text>
          <Text style={styles.subtitle}>Track and manage your spending habits</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowMonthPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color="hsl(240, 3.8%, 46.1%)" />
            <Text style={styles.dateText}>{format(selectedDate, 'MMMM yyyy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="hsl(240, 3.8%, 46.1%)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, formType === 'TRANSACTION' ? styles.actionBtnActiveTrans : styles.actionBtnInactive]}
          onPress={() => toggleForm('TRANSACTION')}
        >
          <Ionicons name="add" size={18} color={formType === 'TRANSACTION' ? '#fff' : 'hsl(240, 3.8%, 46.1%)'} />
          <Text style={[styles.actionBtnText, formType === 'TRANSACTION' && { color: '#fff' }]}>Add New</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, formType === 'DEPOSIT' ? styles.actionBtnActiveDep : styles.actionBtnInactive]}
          onPress={() => toggleForm('DEPOSIT')}
        >
          <Ionicons name="business" size={18} color={formType === 'DEPOSIT' ? '#fff' : 'hsl(240, 3.8%, 46.1%)'} />
          <Text style={[styles.actionBtnText, formType === 'DEPOSIT' && { color: '#fff' }]}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, formType === 'WITHDRAW' ? styles.actionBtnActiveWith : styles.actionBtnInactive]}
          onPress={() => toggleForm('WITHDRAW')}
        >
          <Ionicons name="arrow-up" size={18} color={formType === 'WITHDRAW' ? '#fff' : 'hsl(240, 3.8%, 46.1%)'} />
          <Text style={[styles.actionBtnText, formType === 'WITHDRAW' && { color: '#fff' }]}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, formType === 'TRANSFER' ? styles.actionBtnActiveTransf : styles.actionBtnInactive]}
          onPress={() => toggleForm('TRANSFER')}
        >
          <Ionicons name="swap-horizontal" size={18} color={formType === 'TRANSFER' ? '#fff' : 'hsl(240, 3.8%, 46.1%)'} />
          <Text style={[styles.actionBtnText, formType === 'TRANSFER' && { color: '#fff' }]}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Form Container */}
      {formType && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingTxId ? 'Edit Transaction' : 
              formType === 'TRANSACTION' ? 'Add Transaction' :
              formType === 'DEPOSIT' ? 'Deposit Cash' :
                formType === 'WITHDRAW' ? 'Withdraw Cash' : 'Transfer Money'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {formType === 'TRANSACTION' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date (ISO Format)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={transactionDate}
                onChangeText={setTransactionDate}
              />
            </View>
          )}

          {formType === 'TRANSACTION' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput style={styles.input} placeholder="e.g. Grocery" value={description} onChangeText={setDescription} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={[styles.pickerWrap, editingTxId && { opacity: 0.5 }]}>
                  <Picker selectedValue={categoryId} onValueChange={setCategoryId} enabled={!editingTxId}>
                    <Picker.Item label="Select Category" value="" />
                    {categories.map((c) => <Picker.Item key={c._id} label={c.name} value={c._id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Transaction Type</Text>
                <View style={[styles.pickerWrap, editingTxId && { opacity: 0.5 }]}>
                  <Picker selectedValue={typeId} onValueChange={setTypeId} enabled={!editingTxId}>
                    <Picker.Item label="Select Type" value="" />
                    {transactionTypes.map((t) => <Picker.Item key={t._id} label={t.name} value={t._id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={[styles.pickerWrap, editingTxId && { opacity: 0.5 }]}>
                  <Picker selectedValue={paymentMethodId} onValueChange={setPaymentMethodId} enabled={!editingTxId}>
                    <Picker.Item label="Select Method" value="" />
                    {paymentTypes.map((p) => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
                  </Picker>
                </View>
              </View>
              {paymentTypes.find(p => p._id === paymentMethodId)?.name === 'Bank' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank</Text>
                  <View style={[styles.pickerWrap, editingTxId && { opacity: 0.5 }]}>
                    <Picker selectedValue={bankId} onValueChange={setBankId} enabled={!editingTxId}>
                      <Picker.Item label="Select Bank" value="" />
                      {banks.map((b) => <Picker.Item key={b._id} label={b.bank_name} value={b._id} />)}
                    </Picker>
                  </View>
                </View>
              )}
            </>
          )}

          {(formType === 'DEPOSIT' || formType === 'WITHDRAW' || formType === 'TRANSFER') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{formType === 'TRANSFER' ? 'From Bank' : 'Bank Account'}</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={bankId} onValueChange={setBankId}>
                  <Picker.Item label="Select Bank" value="" />
                  {banks.map((b) => <Picker.Item key={b._id} label={`${b.bank_name} (₹${b.current_balance})`} value={b._id} />)}
                </Picker>
              </View>
            </View>
          )}

          {formType === 'TRANSFER' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To Bank</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={toBankId} onValueChange={setToBankId}>
                  <Picker.Item label="Select Destination Bank" value="" />
                  {banks.filter(b => b._id !== bankId).map((b) => <Picker.Item key={b._id} label={b.bank_name} value={b._id} />)}
                </Picker>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <TouchableOpacity style={[styles.closeFormBtn, { flex: 1 }]} onPress={() => toggleForm(formType)}>
              <Text style={[styles.closeFormText, { textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Transaction Log Title */}
      <View style={styles.logHeader}>
        <Ionicons name="time-outline" size={18} color="hsl(240, 3.8%, 46.1%)" />
        <Text style={styles.logTitle}>TRANSACTION LOG</Text>
      </View>

      {/* List */}
      <View style={styles.list}>
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="hsl(262.1, 83.3%, 57.8%)" />
          </View>
        ) : (
          transactions.map((item) => {
            const isCredit = item.transaction_type?.name === 'Credit';
            const iconColor = isCredit ? '#10b981' : '#ef4444';
            const textColor = isCredit ? '#10b981' : 'hsl(240, 10%, 3.9%)';
            const formattedDate = format(new Date(item.date), 'dd MMM yyyy');

            return (
              <TouchableOpacity key={item._id} style={styles.row} activeOpacity={0.7}>
                <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
                  <Ionicons name={getIconForCategory(item.category?.name)} size={20} color={iconColor} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.rowTitle}>{item.description || item.category?.name}</Text>
                  <Text style={styles.rowCat}>{item.category?.name} • {item.payment_type?.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rowAmount, { color: textColor }]}>
                    {isCredit ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.rowDate}>{formattedDate}</Text>
                    <TouchableOpacity 
                      onPress={() => toggleForm('TRANSACTION', item)}
                      style={styles.listActionBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil-outline" size={18} color="hsl(240, 3.8%, 46.1%)" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteTransaction(item._id)}
                      style={styles.listActionBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        {!isLoading && transactions.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#6b7280', marginVertical: 20 }}>No transactions found.</Text>
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

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Period</Text>

            <View style={styles.pickerRow}>
              <View style={[styles.pickerWrap, { flex: 1 }]}>
                <Picker
                  selectedValue={selectedDate.getMonth()}
                  onValueChange={(val) => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(val);
                    setSelectedDate(newDate);
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Picker.Item key={i} label={format(new Date(2000, i, 1), 'MMMM')} value={i} />
                  ))}
                </Picker>
              </View>

              <View style={[styles.pickerWrap, { flex: 1 }]}>
                <Picker
                  selectedValue={selectedDate.getFullYear()}
                  onValueChange={(val) => {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(val);
                    setSelectedDate(newDate);
                  }}
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <Picker.Item key={y} label={y.toString()} value={y} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowMonthPicker(false)}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: 'hsl(240, 10%, 3.9%)' },
  subtitle: { fontSize: 14, color: 'hsl(240, 3.8%, 46.1%)', marginTop: 4 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)', // secondary/50 approx
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: { fontSize: 14, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)' },
  downloadBtn: {
    padding: 12,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 16,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  actionBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  actionBtnActiveTrans: { backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', shadowColor: 'hsl(262.1, 83.3%, 57.8%)', shadowOpacity: 0.3 }, // primary
  actionBtnActiveDep: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.3 }, // emerald
  actionBtnActiveWith: { backgroundColor: '#f43f5e', shadowColor: '#f43f5e', shadowOpacity: 0.3 }, // rose
  actionBtnActiveTransf: { backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.3 }, // amber
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'hsl(240, 3.8%, 46.1%)',
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
  formTitle: { fontSize: 18, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)', marginBottom: 16 },

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
  pickerWrap: {
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 12,
    overflow: 'hidden',
  },

  closeFormBtn: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'hsl(240, 4.8%, 95.9%)', borderRadius: 12, borderWidth: 1, borderColor: 'hsl(240, 5.9%, 90%)' },
  closeFormText: { fontSize: 14, fontWeight: '600', color: 'hsl(240, 10%, 3.9%)' },

  submitBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'hsl(240, 3.8%, 46.1%)',
    letterSpacing: 1.5,
  },

  list: { paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  info: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: 'hsl(240, 10%, 3.9%)', marginBottom: 2 },
  rowCat: { fontSize: 12, color: 'hsl(240, 3.8%, 46.1%)' },
  rowAmount: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowDate: { fontSize: 11, color: 'hsl(240, 3.8%, 46.1%)' },
  listActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: 'hsl(240, 10%, 3.9%)', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  doneBtn: {
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
