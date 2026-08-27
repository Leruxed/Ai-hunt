import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../../store/authContext";
import { api } from "../../api/client";
import { UserRole } from "../../types";

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.register(email.trim(), password, fullName.trim(), role);
      login(response.access_token, response.user);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Could not register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Create Account</Text>
          <Text style={styles.subTitle}>Join the SkillMatch AI Network</Text>
        </View>

        <View style={styles.card}>
          {/* Role selector */}
          <Text style={styles.label}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === "student" && styles.roleButtonActive]}
              onPress={() => setRole("student")}
            >
              <Text style={[styles.roleText, role === "student" && styles.roleTextActive]}>
                Student / Intern
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === "employer" && styles.roleButtonActive]}
              onPress={() => setRole("employer")}
            >
              <Text style={[styles.roleText, role === "employer" && styles.roleTextActive]}>
                Employer / Recruiter
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            {role === "student" ? "Full Name" : "Company / Representative Name"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={role === "student" ? "Maria Santos" : "Innovate Corp"}
            placeholderTextColor="#64748B"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder={role === "student" ? "student@school.edu" : "hr@company.com"}
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#6366F1",
  },
  subTitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0B111E",
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#6366F1",
    backgroundColor: "#1E1B4B",
  },
  roleText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#A5B4FC",
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#0B111E",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  linkText: {
    color: "#818CF8",
    fontSize: 14,
    fontWeight: "600",
  },
});
