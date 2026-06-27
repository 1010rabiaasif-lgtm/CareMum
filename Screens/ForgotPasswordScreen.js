import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../Firebase/firebase.config';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'Email Sent ✅',
        `A password reset link has been sent to ${email}. Please check your inbox.`,
        [{ text: 'Back to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      let message = 'Something went wrong. Please try again.';
      if (error.code === 'auth/user-not-found')  message = 'No account found with this email.';
      if (error.code === 'auth/invalid-email')   message = 'Please enter a valid email address.';
      Alert.alert('Error', message);
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
        <View style={styles.container}>

          {/* CARD */}
          <View style={styles.card}>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email and we'll send you a reset link.
            </Text>

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

            {/* SEND BUTTON */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send Reset Link</Text>
              }
            </TouchableOpacity>

            {/* BACK TO LOGIN */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#9b9797',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  label: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 6,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.6)',
    color: '#111827',
    marginBottom: 15,
  },

  button: {
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  backBtn: {
    marginTop: 15,
    alignItems: 'center',
  },

  backText: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});