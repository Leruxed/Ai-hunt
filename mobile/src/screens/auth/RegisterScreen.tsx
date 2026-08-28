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
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.register(email.trim().toLowerCase(), password, fullName.trim(), role);
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

        <Card style={styles.card}>
          {/* Role selector */}
          <Text style={styles.label}>I am registering as a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === "student" && styles.roleButtonActive]}
              onPress={() => setRole("student")}
            >
              <Text style={[styles.roleText, role === "student" && styles.roleTextActive]}>
                Student / Candidate
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
            {role === "student" ? "Full Name" : "Company / Recruiter Name"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={role === "student" ? "Juan Dela Cruz" : "Acme Corp / HR"}
            placeholderTextColor={colors.textDisabled}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder={role === "student" ? "student@school.edu" : "recruiter@company.com"}
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textDisabled}
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
              <Text style={styles.buttonText}>
                {role === "student" ? "Create Student Account" : "Create Employer Account"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subTitle: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  roleContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  roleTextActive: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusSm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "700",
  },
});
