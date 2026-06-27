import "react-native-gesture-handler";
import React from "react";

import { auth } from "./Firebase/firebase.config";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";

// Screens
import SignupScreen from "./Screens/SignupScreen";
import SplashScreen from "./Screens/SplashScreen";
import SignInScreen from "./Screens/SignInScreen";
import RoleSelectionScreen from "./Screens/RoleSelectionScreen";
import ProfileSetupScreen from "./Screens/ProfileSetupScreen";

import PatientDashboard from "./Screens/PatientDashboard";
import DoctorDashboard from "./Screens/DoctorDashboard";
import HealthTracker from "./Screens/HealthTracker";
import Appointments from "./Screens/Appointments";
import Chat from "./Screens/Chat";
import Profile from "./Screens/Profile";
import PatientHealthTracker from "./Screens/PatientHealthTracker";
import PatientAppointments from "./Screens/PatientAppointments";
import PatientChat from "./Screens/PatientChat";
import PatientProfile from "./Screens/PatientProfile";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import BookAppointmentScreen from "./Screens/BookAppointmentScreen";
import ChatScreen from './Screens/ChatScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// 🔵 DOCTOR TABS
function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "gray",

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") iconName = "dashboard";
          else if (route.name === "Health") iconName = "favorite";
          else if (route.name === "Appointments") iconName = "event";
          else if (route.name === "Chat") iconName = "chat";
          else if (route.name === "Profile") iconName = "person";

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },

        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DoctorDashboard} />
      <Tab.Screen name="Health" component={HealthTracker} />
      <Tab.Screen name="Appointments" component={Appointments} />
      <Tab.Screen name="Chat" component={Chat} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}


function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") iconName = "home";
          else if (route.name === "Health") iconName = "favorite";
          else if (route.name === "Appointments") iconName = "event";
          else if (route.name === "Chat") iconName = "chat";
          else if (route.name === "Profile") iconName = "person";

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PatientDashboard} />
      <Tab.Screen name="Health" component={PatientHealthTracker} />
      <Tab.Screen name="Appointments" component={PatientAppointments} />
      <Tab.Screen name="Chat" component={PatientChat} />
      <Tab.Screen name="Profile" component={PatientProfile} />
    </Tab.Navigator>
  );
}



// 🔵 MAIN APP
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#DCF0F5",
          },
          headerTintColor: "#090979",
        }}
      >
        <Stack.Screen
          name="CareMum"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        {/* AUTH */}
        <Stack.Screen name="Register" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Login" component={SignInScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
        <Stack.Screen name="DoctorAppointment" component={Appointments} />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        {/* Splash FIRST */}


        {/* PATIENT APP */}
        <Stack.Screen
          name="PatientHome"
          component={PatientTabs}
          options={{ headerShown: false }}
        />

        {/* DOCTOR APP */}
        <Stack.Screen
          name="DoctorHome"
          component={DoctorTabs}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});