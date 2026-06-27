import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../Firebase/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

const SignInScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // Step 2: Check if profile already exists in Firestore
      const docSnap = await getDoc(doc(db, 'users', uid));

      if (docSnap.exists()) {
        // Profile exists → skip Role Selection & Profile Setup → go directly to dashboard
        const role = docSnap.data().role;
        navigation.reset({
          index: 0,
          routes: [{ name: role === 'doctor' ? 'DoctorHome' : 'PatientHome' }],
        });
      } else {
        // First time → no profile yet → go through setup flow
        navigation.navigate('RoleSelection');
      }

    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found')     message = 'No account found with this email.';
      if (error.code === 'auth/wrong-password')     message = 'Incorrect password. Please try again.';
      if (error.code === 'auth/invalid-email')      message = 'Please enter a valid email address.';
      if (error.code === 'auth/too-many-requests')  message = 'Too many failed attempts. Try again later.';
      if (error.code === 'auth/invalid-credential') message = 'Invalid email or password.';

      Alert.alert('Login Failed', message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/Logo .png')}
              style={styles.logo}
            />
          </View>

          {/* CARD */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>

            {/* EMAIL */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* PASSWORD */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              onPress={login}
              style={[styles.button, loading && { opacity: 0.7 }]}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Login</Text>
              }
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUp}> Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* FORGOT PASSWORD */}
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot your Password?</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    position: 'absolute',
    top: 80,
    zIndex: 10,
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },

  card: {
    width: '85%',
    padding: 20,
    borderRadius: 20,
    marginTop: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#9b9797',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 10,
  },

  label: {
    marginTop: 10,
    marginBottom: 5,
    color: '#1F2937',
    fontWeight: '600',
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.6)',
    color: '#111827',
    marginBottom: 10,
  },

  button: {
    marginTop: 10,
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },

  footerText: { color: '#374151' },

  signUp: {
    color: '#1E3A8A',
    fontWeight: 'bold',
    marginLeft: 5,
  },

  forgotText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#1E3A8A',
    fontStyle: 'italic',
  },
});