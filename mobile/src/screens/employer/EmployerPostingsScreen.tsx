import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../store/authContext";
import { api } from "../../api/client";
import { JobPosting, JobType } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";

export const EmployerPostingsScreen = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType>("internship");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPostings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.getMyPostings();
      setPostings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your employer account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleCreatePosting = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Required Fields", "Please provide a job title and description.");
      return;
    }
    setCreating(true);
    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createJobPosting({
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || "Metro Manila / Remote",
        job_type: jobType,
        required_skills: skillsArray.length > 0 ? skillsArray : ["General IT Skills"],
      });

      setModalVisible(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setRequiredSkills("");
      fetchPostings(true);
      Alert.alert("Success", "New job posting published to student match feed!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create posting.");
    } finally {
      setCreating(false);
    }
  };

  const renderPostingItem = ({ item }: { item: JobPosting }) => {
    const jobTypeBadge =
      item.job_type === "internship"
        ? "Internship"
        : item.job_type === "ojt"
        ? "OJT"
        : "Full-Time";

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{jobTypeBadge}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.posted_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.locationText}>{item.location || "Remote / Metro Manila"}</Text>

        <View style={styles.skillsWrap}>
          {item.required_skills.slice(0, 5).map((skill, idx) => (
            <View key={idx} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
          {item.required_skills.length > 5 && (
            <View style={styles.moreChip}>
              <Text style={styles.moreChipText}>
                +{item.required_skills.length - 5} more
              </Text>
            </View>
          )}
        </View>

        {/* View Applicants Action Button */}
        <TouchableOpacity
          style={styles.viewApplicantsBtn}
          onPress={() =>
            navigation.navigate("EmployerApplicants", {
              postingId: item.id,
              postingTitle: item.title,
            })
          }
        >
          <Text style={styles.viewApplicantsBtnText}>
            View AI-Ranked Applicants ➔
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Job Postings</Text>
            <Text style={styles.headerSubtitle}>
              Manage active listings and applicant pipelines
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.createBtnText}>+ New Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading company postings...</Text>
        </View>
      ) : (
        <FlatList
          data={postings}
          keyExtractor={(item) => item.id}
          renderItem={renderPostingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPostings(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Job Postings Yet</Text>
              <Text style={styles.emptySub}>
                Publish an internship or OJT vacancy to automatically source AI-matched candidates.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyCtaText}>Create First Posting</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal: Create Job Posting */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Job Posting</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Backend Engineering Intern"
                placeholderTextColor={colors.textDisabled}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Job Type</Text>
              <View style={styles.typeSelectorRow}>
                {(["internship", "ojt", "full_time"] as JobType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      jobType === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setJobType(type)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        jobType === type && styles.typeOptionTextSelected,
                      ]}
                    >
                      {type === "internship"
                        ? "Internship"
                        : type === "ojt"
                        ? "OJT"
                        : "Full-Time"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Location / Mode</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Makati / Remote"
                placeholderTextColor={colors.textDisabled}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.label}>Required Skills (Comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Python, FastAPI, PostgreSQL, Git"
                placeholderTextColor={colors.textDisabled}
                value={requiredSkills}
                onChangeText={setRequiredSkills}
              />

              <Text style={styles.label}>Job Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe role responsibilities, team culture, and learning opportunities..."
                placeholderTextColor={colors.textDisabled}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
                onPress={handleCreatePosting}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Job Posting</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: spacing.radiusMd,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: spacing.radiusMd,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  listContent: {
    padding: spacing.lg,
  },
  card: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  typeBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  typeBadgeText: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.md,
  },
  skillChip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderIndigo,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillChipText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "500",
  },
  moreChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    justifyContent: "center",
  },
  moreChipText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: "600",
  },
  viewApplicantsBtn: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  viewApplicantsBtnText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    ...typography.muted,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  emptyCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.radiusMd,
  },
  emptyCtaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
  },
  typeOptionSelected: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  typeOptionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  typeOptionTextSelected: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
