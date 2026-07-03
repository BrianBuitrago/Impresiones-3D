'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

export interface UserProfile {
  uid: string;
  nombre: string;
  cedula: string;
  rol: 'administrador' | 'cliente' | 'colaborador';
  edad: number;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  creado_en?: string;
  categorias?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  token: string | null;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (userData: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sincronizar perfil local con el backend usando el token de Firebase
  const fetchProfile = async (firebaseUser: FirebaseUser, idToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Sincronizar perfil en Firestore para permisos de staff en reglas de seguridad
        try {
          const userRef = doc(db!, 'users', firebaseUser.uid);
          await setDoc(userRef, {
            nombre: data.nombre || firebaseUser.displayName || '',
            email: data.email || firebaseUser.email || '',
            rol: data.rol || 'cliente',
          }, { merge: true });
        } catch (e) {
          console.error('Error al sincronizar perfil a Firestore:', e);
        }
      } else {
        console.warn('No se pudo obtener el perfil de Firestore local.');
        setProfile(null);
      }
    } catch (err) {
      console.error('Error al sincronizar perfil con backend:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user && token) {
      await fetchProfile(user, token);
    }
  };

  // Escuchar cambios de estado en Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          await fetchProfile(firebaseUser, idToken);
        } catch (e) {
          console.error("Error al obtener token de ID de Firebase:", e);
        }
      } else {
        setUser(null);
        setProfile(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login con Google
  const loginWithGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      
      // Sincronizar backend tras Google Login
      const syncResponse = await fetch(`${API_URL}/auth/sync-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_token: idToken,
          nombre: credential.user.displayName,
          email: credential.user.email
        })
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.detail || 'Error al sincronizar usuario de Google con el backend.');
      }

      const syncProfile = await syncResponse.json();
      setProfile(syncProfile);
      setToken(idToken);
      setUser(credential.user);
      return syncProfile;
    } catch (error) {
      console.error('Error en Login con Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login con Correo y Contraseña
  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await credential.user.getIdToken();
      
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo obtener el perfil de usuario del backend.');
      }

      const userProfile = await response.json();
      setProfile(userProfile);
      setToken(idToken);
      setUser(credential.user);
      return userProfile;
    } catch (error) {
      console.error('Error en Login con Correo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registro con Correo y Contraseña
  const registerWithEmail = async (userData: any): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. Crear el usuario en la base de datos a través de nuestro Backend
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.detail || 'Error al registrar el perfil en el backend.');
      }

      const newProfile = await registerResponse.json();

      // 2. Iniciar sesión automáticamente en el cliente tras el registro
      const credential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
      const idToken = await credential.user.getIdToken();
      
      setProfile(newProfile);
      setToken(idToken);
      setUser(credential.user);
      return newProfile;
    } catch (error) {
      console.error('Error en Registro de Correo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar Sesión
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setToken(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      token,
      loginWithGoogle, 
      loginWithEmail, 
      registerWithEmail, 
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
