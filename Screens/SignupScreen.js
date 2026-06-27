import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';

import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebase.config';

const SignupScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill all fields');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert('User Created Successfully');
        navigation.navigate('Login');
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/Logo .png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            placeholder="User Email"
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={signup}
            style={styles.signupButton}
          >
            <Text style={styles.signupButtonText}>
              Sign Up
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signIn}>
                {' '}Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default SignupScreen;
const styles = StyleSheet.create(
  {
    background: { flex: 1, },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      position: 'absolute',
      top: 80,
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
      marginBottom: 60,
    },
    card: {
      width: '85%',
      padding: 20,
      borderRadius: 20,
      marginTop: 60,
      backgroundColor: 'rgba(255,255,255,0.25)',
      shadowColor: '#000',
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
    signupButton: {
      height: 55,
      borderRadius: 12,
      backgroundColor: '#1E3A8A',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
    },
    signupButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
    },
    footerText: { color: '#374151', },
    signIn: {
      color: '#1E3A8A',
      fontWeight: 'bold',
      marginLeft: 5,
    },
  });