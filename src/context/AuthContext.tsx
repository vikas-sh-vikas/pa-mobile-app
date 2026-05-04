import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, mobileNo: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('@ag_user');
        if (stored) setUser(JSON.parse(stored));
      } catch (_) {}
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Please fill all fields');

    try {
      const response = await fetch('https://backend-nodejs-pa.vercel.app/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, provider: 'credentials' }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Login failed');
      }

      const { user: apiUser, accessToken } = json.data;

      const u: User = {
        id: apiUser._id,
        name: apiUser.full_name || apiUser.user_name,
        email: apiUser.email,
        avatar: apiUser.profile_picture,
      };

      await AsyncStorage.multiSet([
        ['@ag_user', JSON.stringify(u)],
        ['@ag_token', accessToken],
      ]);
      setUser(u);
    } catch (error: any) {
      throw new Error(error.message || 'An error occurred during login');
    }
  };

  const register = async (name: string, email: string, password: string, mobileNo: string) => {
    if (!name || !email || !password || !mobileNo) throw new Error('Please fill all fields');

    try {
      const formdata = new FormData();
      formdata.append("user_name", email); // Using email as user_name based on typical patterns if user_name is required
      formdata.append("email", email);
      formdata.append("password", password);
      formdata.append("full_name", name);
      formdata.append("mobileNo", mobileNo);
      // profilepic is optional, omitted for now unless ImagePicker is integrated

      const requestOptions = {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          // Note: FormData boundaries are automatically set by fetch, do not set Content-Type manually
        },
        body: formdata,
      };

      const response = await fetch("https://backend-nodejs-pa.vercel.app/api/users/register", requestOptions);
      const json = await response.json();
      console.log("json",json);
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Registration failed');
      }

      // We do not auto-login here, Registration just succeeds and we return
    } catch (error: any) {
      throw new Error(error.message || 'An error occurred during registration');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@ag_user', '@ag_token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
