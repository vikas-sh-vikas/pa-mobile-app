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
  password: string;
};

const validationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
  password: yup.string().required('Password is required'),
});

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const defaultValues: Inputs = { email: '', password: '' };

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
      await login(data.email.trim(), data.password);
    } catch (error: any) {
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      Alert.alert('Google Sign-In', 'Google OAuth not configured yet.');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsGoogleLoading(false);
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
          <Text style={styles.cardTitle}>Login</Text>

          {/* Email / Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email/Username <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email/username"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    editable={!isSubmitting}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter Password"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    editable={!isSubmitting}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={styles.eyeBtn}
                    disabled={isSubmitting}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Forgot / Sign up row */}
          <View style={styles.linksRow}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.primaryBtnText}>
              {isSubmitting ? 'Loading....' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Or divider */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>Or</Text>
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isGoogleLoading && styles.btnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            activeOpacity={0.85}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons
                name="logo-google"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.primaryBtnText}>
              {isGoogleLoading ? 'Loading....' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'hsl(0, 0%, 100%)' }, 
  container: { flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }, 
  
  card: {
    backgroundColor: 'hsl(0, 0%, 100%)', 
    borderRadius: 12, // var(--radius) is 0.75rem = 12px
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
    fontFamily: 'System', // Outfit if loaded, fallback to system
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: 'hsl(240, 10%, 3.9%)', marginBottom: 6 }, 
  required: { color: 'hsl(0, 84.2%, 60.2%)' }, 
  
  inputWrap: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'transparent', 
    borderRadius: 12, // var(--radius)
    borderWidth: 1, 
    borderColor: 'hsl(240, 5.9%, 90%)', 
    paddingHorizontal: 12,
  },
  inputError: { borderColor: 'hsl(0, 84.2%, 60.2%)' }, 
  input: { flex: 1, height: 44, color: 'hsl(240, 10%, 3.9%)', fontSize: 14 },
  eyeBtn: { padding: 4 },
  errorText: { color: 'hsl(0, 84.2%, 60.2%)', fontSize: 12, marginTop: 4 }, 

  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  linkText: { color: 'hsl(262.1, 83.3%, 57.8%)', fontSize: 14, fontWeight: '500' }, 

  primaryBtn: {
    backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', 
    borderRadius: 12, // var(--radius)
    height: 44, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  primaryBtnText: { color: 'hsl(210, 20%, 98%)', fontSize: 16, fontWeight: '500' }, 
  
  btnDisabled: { opacity: 0.7 },
  
  divider: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  dividerText: { color: 'hsl(240, 3.8%, 46.1%)', fontSize: 14 }, 
});
