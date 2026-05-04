import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, LayoutAnimation, UIManager, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setIsLoadingDetail(true);
      const token = await AsyncStorage.getItem('@ag_token');
      const response = await fetch('https://backend-nodejs-pa.vercel.app/api/users/getUserDetail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const json = await response.json();
      if (json.success) {
        setUserDetail(json.data?.data || json.data);
      }
    } catch (error) {
      console.log('Error fetching user detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const toggleEdit = async () => {
    if (!editMode) {
      await fetchUserDetail();
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditMode(!editMode);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.profileCard}>
          {/* Profile Header Background */}
          <View style={styles.coverBg}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
              </View>
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
                <Text style={styles.userHandle}>
                  <Ionicons name="at" size={14} color="hsl(240, 3.8%, 46.1%)" /> {user?.name?.toLowerCase().replace(' ', '') || 'username'}
                </Text>
              </View>

              <View style={styles.actionBtnsWrap}>
                {!editMode && (
                  <TouchableOpacity style={styles.editBtn} onPress={toggleEdit}>
                    <Ionicons name="pencil" size={16} color="hsl(262.1, 83.3%, 57.8%)" />
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color="#f43f5e" />
                  <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!editMode ? (
              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}><Ionicons name="mail" size={12} /> EMAIL ADDRESS</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}><Ionicons name="person" size={12} /> FULL NAME</Text>
                  <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.editForm}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.formTitle}>Edit Profile Information</Text>
                  {isLoadingDetail && <ActivityIndicator size="small" color="hsl(262.1, 83.3%, 57.8%)" />}
                </View>
                
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputText}>{userDetail?.full_name || user?.name || 'Loading...'}</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Email (Disabled)</Text>
                  <View style={[styles.inputBox, { backgroundColor: 'hsl(240, 4.8%, 95.9%)' }]}>
                    <Text style={styles.inputText}>{userDetail?.email || user?.email}</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputText}>{userDetail?.mobileNo || 'Not set'}</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputText}>{userDetail?.user_name || user?.name?.toLowerCase().replace(' ', '')}</Text>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={toggleEdit}>
                    <Ionicons name="close" size={18} color="hsl(240, 3.8%, 46.1%)" />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={toggleEdit}>
                    <Ionicons name="save" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  
  profileCard: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: 'hidden',
  },

  coverBg: {
    height: 120,
    backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.8)',
    position: 'relative',
  },
  
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    left: 24,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'hsl(0, 0%, 100%)',
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: 'hsl(262.1, 83.3%, 57.8%)',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)',
    padding: 8,
    borderRadius: 12,
    shadowColor: 'hsl(262.1, 83.3%, 57.8%)',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  contentArea: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  headerRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleWrap: { marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: '900', color: 'hsl(240, 10%, 3.9%)', marginBottom: 4 },
  userHandle: { fontSize: 14, color: 'hsl(240, 3.8%, 46.1%)', fontWeight: '500' },
  
  actionBtnsWrap: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  editBtnText: { color: 'hsl(262.1, 83.3%, 57.8%)', fontWeight: '700', fontSize: 13 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'hsla(346.8, 77.2%, 49.8%, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  logoutBtnText: { color: '#f43f5e', fontWeight: '700', fontSize: 13 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: 'hsl(240, 4.8%, 95.9%)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'hsl(240, 3.8%, 46.1%)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'hsl(240, 10%, 3.9%)',
  },

  editForm: {
    marginTop: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(240, 10%, 3.9%)',
    marginBottom: 16,
  },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: 'hsl(240, 10%, 3.9%)', marginBottom: 8 },
  inputBox: {
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  inputText: { fontSize: 14, color: 'hsl(240, 10%, 3.9%)' },
  
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'hsl(240, 5.9%, 90%)',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelBtnText: { color: 'hsl(240, 3.8%, 46.1%)', fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: 'hsl(262.1, 83.3%, 57.8%)',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
