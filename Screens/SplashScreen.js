import React, { useEffect } from 'react';

import {
  StyleSheet,
  View,
  Image,
  StatusBar,
} from 'react-native';


const SplashScreen = ({ navigation }) => {

  useEffect(() => {

    const timer = setTimeout(async () => {

      try {

        const isLoggedIn =
          await AsyncStorage.getItem(
            'userLoggedIn'
          );

        const userRole =
          await AsyncStorage.getItem(
            'userRole'
          );

        const profileCompleted =
          await AsyncStorage.getItem(
            'profileCompleted'
          );

        // NOT LOGGED IN
        if (isLoggedIn !== 'true') {

          navigation.replace('Login');
          return;
        }

        // ROLE NOT SELECTED
        if (!userRole) {

          navigation.replace(
            'RoleSelection'
          );

          return;
        }

        // PROFILE NOT COMPLETED
        if (
          profileCompleted !== 'true'
        ) {

          navigation.replace(
            'ProfileSetup',
            {
              role: userRole,
            }
          );

          return;
        }

        // GO TO HOME
        if (userRole === 'doctor') {

          navigation.replace(
            'DoctorHome'
          );

        } else {

          navigation.replace(
            'PatientHome'
          );
        }

      } catch (error) {

        console.log(error);

        navigation.replace('Login');
      }

    }, 2000);

    return () => clearTimeout(timer);

  }, []);

  return (

    <View style={styles.container}>

      <StatusBar
        backgroundColor="#DCF0F5"
        barStyle="dark-content"
      />

      <Image
        source={require('../assets/Logo .png')}
        style={styles.logo}
      />

    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#DCF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
  },

});