// BottomTab.js
import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Home,
  Gift,
  FileText,
  User,
  QrCode,
  Home as HomeFilled,
  Gift as GiftFilled,
  FileText as FileTextFilled,
  User as UserFilled,
  QrCode as QrCodeFilled,
} from "lucide-react-native";
import { moderateScale } from "react-native-size-matters";

// Screens
import HomeScreen from "../Screens/Home/Home";
import Redeem from "../Screens/Redeem/Redeem";
import Report from "../Screens/Report/Report";
import Profile from "../Screens/Profile/Profile";
import QR from "../Screens/QR/qr";

const Tab = createBottomTabNavigator();

const BottomTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          height: moderateScale(68),
          paddingBottom: moderateScale(10),
          paddingTop: moderateScale(8),
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(11),
          fontWeight: "600",
          marginBottom: moderateScale(2),
        },
      }}
    >
      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <HomeFilled
                size={moderateScale(25)}
                color="#4CAF50"
                fill="#4CAF50"
                strokeWidth={2.5}
              />
            ) : (
              <Home size={moderateScale(25)} color="#9E9E9E" strokeWidth={2} />
            ),
        }}
      />

      {/* Redeem */}
      <Tab.Screen
        name="Redeem"
        component={Redeem}
        options={{
          tabBarLabel: "Redeem",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <GiftFilled
                size={moderateScale(25)}
                color="#4CAF50"
                fill="#4CAF50"
                strokeWidth={2.5}
              />
            ) : (
              <Gift size={moderateScale(25)} color="#9E9E9E" strokeWidth={2} />
            ),
        }}
      />

      {/* QR */}
      <Tab.Screen
        name="Scan"
        component={QR}
        options={{
          tabBarLabel: "Scan",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <QrCodeFilled
                size={moderateScale(25)}
                color="#4CAF50"
                fill="#4CAF50"
                strokeWidth={2.5}
              />
            ) : (
              <QrCode
                size={moderateScale(25)}
                color="#9E9E9E"
                strokeWidth={2}
              />
            ),
        }}
      />

      {/* Report */}
      <Tab.Screen
        name="Report"
        component={Report}
        options={{
          tabBarLabel: "Report",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <FileTextFilled
                size={moderateScale(25)}
                color="#4CAF50"
                fill="#4CAF50"
                strokeWidth={2.5}
              />
            ) : (
              <FileText
                size={moderateScale(25)}
                color="#9E9E9E"
                strokeWidth={2}
              />
            ),
        }}
        />


      {/* Profile */}
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <UserFilled
                size={moderateScale(25)}
                color="#4CAF50"
                fill="#4CAF50"
                strokeWidth={2.5}
              />
            ) : (
              <User size={moderateScale(25)} color="#9E9E9E" strokeWidth={2} />
            ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTab;
