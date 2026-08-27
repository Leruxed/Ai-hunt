import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../store/authContext";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { RecommendationFeedScreen } from "../screens/jobs/RecommendationFeedScreen";
import { ApplicationTrackerScreen } from "../screens/applications/ApplicationTrackerScreen";
import { ResumeUploadScreen } from "../screens/resume/ResumeUploadScreen";
import { ResumeReviewScreen } from "../screens/resume/ResumeReviewScreen";
import { EmployerPostingsScreen } from "../screens/employer/EmployerPostingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Resume Stack (Upload -> Review/Edit)
const ResumeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#090D16" },
      headerTintColor: "#F8FAFC",
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen
      name="ResumeMain"
      component={ResumeUploadScreen}
      options={{ title: "Resume Profile" }}
    />
    <Stack.Screen
      name="ResumeReview"
      component={ResumeReviewScreen}
      options={{ title: "Verify Extracted Skills" }}
    />
  </Stack.Navigator>
);

// Student Tab Navigator
const StudentTabNavigator = () => {
  const { logout, user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#090D16" },
        headerTintColor: "#F8FAFC",
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#0B111E",
          borderTopColor: "#1E293B",
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: "#818CF8",
        tabBarInactiveTintColor: "#64748B",
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}>
              Log Out
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Recommendations"
        component={RecommendationFeedScreen}
        options={{ title: "Opportunities" }}
      />
      <Tab.Screen
        name="ApplicationsTab"
        component={ApplicationTrackerScreen}
        options={{ title: "Applications" }}
      />
      <Tab.Screen
        name="ResumeTab"
        component={ResumeStack}
        options={{ title: "My Resume", headerShown: false }}
      />
    </Tab.Navigator>
  );
};

// Employer Tab Navigator
const EmployerTabNavigator = () => {
  const { logout } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#090D16" },
        headerTintColor: "#F8FAFC",
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#0B111E",
          borderTopColor: "#1E293B",
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: "#818CF8",
        tabBarInactiveTintColor: "#64748B",
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}>
              Log Out
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="EmployerPostings"
        component={EmployerPostingsScreen}
        options={{ title: "Postings & Applicants" }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
export const RootNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user?.role === "employer" ? (
          <Stack.Screen name="EmployerHome" component={EmployerTabNavigator} />
        ) : (
          <Stack.Screen name="StudentHome" component={StudentTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
