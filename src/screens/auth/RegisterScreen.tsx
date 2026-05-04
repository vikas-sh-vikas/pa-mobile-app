import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Inputs = {
  email: string;
  fullName: string;
  mobileNo: string;
  password: string;
  confirmPassword: string;
};

const validationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
  fullName: yup.string().required('Full name is required'),
  mobileNo: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  password: yup.string().required('Password is required'),
  confirmPassword: yup
    .string()
    .required('Confirm Password is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { register: registerUser } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const defaultValues: Inputs = {
    email: '',
    fullName: '',
    mobileNo: '',
    password: '',
    confirmPassword: '',
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    mode: 'all',
    defaultValues,
    resolver: yupResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await registerUser(data.fullName.trim(), data.email.trim(), data.password, data.mobileNo.trim());
      Alert.alert('Success', 'Registration successful', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                </View>
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.fullName && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter fullName"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>
              )}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
          </View>

          {/* Mobile No */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile No</Text>
            <Controller
              control={control}
              name="mobileNo"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.mobileNo && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile no"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                </View>
              )}
            />
            {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo.message}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter password"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPass}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.confirmPassword && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter password"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPass}
                    editable={!isSubmitting}
                  />
                   <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
          </View>

          {/* File Picker Placeholder */}
          <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Picture</Text>
              <TouchableOpacity style={styles.filePickerBtn}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" style={{ marginBottom: 10 }} />
                  <Text style={styles.filePickerText}><Text style={{ fontWeight: 'bold' }}>Click to upload</Text> or drag and drop</Text>
                  <Text style={styles.filePickerSub}>PNG, JPG, JPEG (Max 5MB)</Text>
              </TouchableOpacity>
          </View>

          <View style={styles.linksRow}>
            <Text style={styles.alreadyText}>
              already have an account{' '}
              <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
                Log In
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.primaryBtnText}>
              {isSubmitting ? 'Loading....' : 'Log In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' }, 
  container: { flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }, 
  
  card: {
    backgroundColor: 'hsl(0, 0%, 100%)', 
    borderRadius: 12, 
    padding: 32, 
    width: '100%',
    maxWidth: 448, 
    shadowColor: 'hsl(240, 10%, 3.9%)',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2, 
    borderWidth: 1,
    borderColor: 'hsl(240, 5.9%, 90%)',
  },
  cardTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 24, 
    color: 'hsl(240, 10%, 3.9%)', 
    fontFamily: 'System', 
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: 'hsl(240, 10%, 3.9%)', marginBottom: 6 }, 
  
  inputWrap: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'transparent', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'hsl(240, 5.9%, 90%)', 
    paddingHorizontal: 12,
  },
  inputError: { borderColor: 'hsl(0, 84.2%, 60.2%)' }, 
  input: { flex: 1, height: 44, color: 'hsl(240, 10%, 3.9%)', fontSize: 14 },
  eyeBtn: { padding: 4 },
  errorText: { color: 'hsl(0, 84.2%, 60.2%)', fontSize: 12, marginTop: 4 }, 

  filePickerBtn: {
      borderWidth: 2,
      borderColor: 'hsl(240, 5.9%, 90%)', 
      borderStyle: 'dashed',
      borderRadius: 12, 
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'hsl(240, 4.8%, 95.9%)', 
  },
  filePickerText: {
      color: 'hsl(240, 3.8%, 46.1%)', 
      fontSize: 14,
  },
  filePickerSub: {
      color: 'hsl(240, 3.8%, 46.1%)',
      fontSize: 12,
      marginTop: 4,
  },

  linksRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  alreadyText: { color: 'hsl(240, 3.8%, 46.1%)', fontSize: 14, paddingVertical: 10 },
  linkText: { color: 'hsl(262.1, 83.3%, 57.8%)', fontWeight: 'bold' }, 

  primaryBtn: {
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', 
    borderRadius: 12, 
    height: 44, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  primaryBtnText: { color: 'hsl(210, 20%, 98%)', fontSize: 16, fontWeight: '500' }, 
  
  btnDisabled: { opacity: 0.7 },
});
