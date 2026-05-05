import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../api/apiHelper';

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
  register: (name: string, email: string, password: string, mobileNo: string, profilePic?: any) => Promise<void>;
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
      const json = await apiCall('/users/login', {
        method: 'POST',
        body: { email, password, provider: 'credentials' },
      });

      if (!json.success) {
        throw new Error(json.message || 'Login failed');
      }

      const { user: apiUser, accessToken } = json.data;

      const u: User = {
        id: apiUser._id,
        name: apiUser.full_name || apiUser.user_name,
        email: apiUser.email,
        avatar: apiUser.profile_picture || apiUser.profilepic,
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

  const register = async (name: string, email: string, password: string, mobileNo: string, profilePic?: any) => {
    if (!name || !email || !password || !mobileNo) throw new Error('Please fill all fields');

    try {
      const formdata = new FormData();
      formdata.append("user_name", email);
      formdata.append("email", email);
      formdata.append("password", password);
      formdata.append("full_name", name);
      formdata.append("mobileNo", mobileNo);
      
      if (profilePic) {
        // profilePic is from expo-image-picker
        const filename = profilePic.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formdata.append('profilepic', {
          uri: profilePic.uri,
          name: filename,
          type: type
        } as any);
      }

      console.log("formdata", formdata);

      const json = await apiCall('/users/register', {
        method: 'POST',
        body: formdata,
        isFormData: true,
      });
      console.log("Registerjason",json);
      if (!json.success) {
        throw new Error(json.errors[0].message || 'Registration failed');
      }
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
