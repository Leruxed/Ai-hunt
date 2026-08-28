import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../../api/client";
import { RankedApplicant, ApplicationStatus } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";
import { ScoreBadge } from "../../components/common/ScoreBadge";
import { SkillChip } from "../../components/common/SkillChip";

const STATUS_ACTIONS: { label: string; status: ApplicationStatus; color: string }[] = [
  { label: "Shortlist", status: "shortlisted", color: colors.primary },
  { label: "Interview", status: "interview_scheduled", color: "#3B82F6" },
  { label: "Accept", status: "accepted", color: colors.success },
  { label: "Reject", status: "rejected", color: colors.danger },
];

export const EmployerApplicantsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { postingId, postingTitle } = route.params || {};

  const [applicants, setApplicants] = useState<RankedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplicants = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await api.getPostingApplicants(postingId);
      setApplicants(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load ranked applicants.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [postingId]);

  const handleStatusUpdate = async (applicant: RankedApplicant, newStatus: ApplicationStatus) => {
    if (applicant.status === newStatus) return;
    setUpdatingId(applicant.application_id);
    try {
      await api.updateApplicationStatus(applicant.application_id, newStatus);
      setApplicants((prev) =>
        prev.map((app) =>
          app.application_id === applicant.application_id
            ? { ...app, status: newStatus }
            : app
        )
      );
      Alert.alert(
        "Candidate Updated",
        `Application status moved to ${newStatus.replace("_", " ")}. Student notified.`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update candidate status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const renderApplicantCard = ({ item, index }: { item: RankedApplicant; index: number }) => {
    const isUpdating = updatingId === item.application_id;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.candidateName}>{item.candidate_name}</Text>
            <Text style={styles.candidateEmail}>{item.candidate_email}</Text>
          </View>
          <ScoreBadge score={item.match_score} size={42} />
        </View>

        {/* Explainability Summary */}
        <Text style={styles.explanationText}>{item.explanation.summary}</Text>

        {/* Matched Skills */}
        {item.explanation.matched_skills.length > 0 && (
          <View style={styles.skillSection}>
            <Text style={styles.skillSectionTitle}>
              Matched Skills ({item.explanation.matched_skills.length}):
            </Text>
            <View style={styles.chipRow}>
              {item.explanation.matched_skills.map((skill, idx) => (
                <SkillChip key={idx} label={skill} variant="matched" />
              ))}
            </View>
          </View>
        )}

        {/* Missing Skills */}
        {item.explanation.missing_skills.length > 0 && (
          <View style={styles.skillSection}>
            <Text style={styles.skillSectionTitleWarning}>
              Missing Required Skills:
            </Text>
            <View style={styles.chipRow}>
              {item.explanation.missing_skills.map((skill, idx) => (
                <SkillChip key={idx} label={skill} variant="missing" />
              ))}
            </View>
          </View>
        )}

        {/* Status Actions Toolbar */}
        <View style={styles.actionToolbar}>
          <Text style={styles.currentStatusLabel}>
            Status: <Text style={styles.statusValue}>{item.status.replace("_", " ").toUpperCase()}</Text>
          </Text>
          <View style={styles.btnRow}>
            {STATUS_ACTIONS.map((action) => {
              const isActive = item.status === action.status;
              return (
                <TouchableOpacity
                  key={action.status}
                  style={[
                    styles.actionBtn,
                    { borderColor: action.color },
                    isActive && { backgroundColor: action.color },
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleStatusUpdate(item, action.status)}
                  disabled={isUpdating}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: isActive ? "#FFFFFF" : action.color },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back to Postings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI-Ranked Candidates</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {postingTitle || "Job Position"}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Ranking applicants by hybrid AI affinity...</Text>
        </View>
      ) : (
        <FlatList
          data={applicants}
          keyExtractor={(item) => item.application_id}
          renderItem={renderApplicantCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApplicants(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Applicants Yet</Text>
              <Text style={styles.emptySub}>
                When students apply, they will automatically appear here pre-ranked by skill alignment.
              </Text>
            </View>
          }
        />
      )}
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
  backBtn: {
    marginBottom: spacing.xs,
  },
  backBtnText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: "600",
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
  listContent: {
    padding: spacing.lg,
  },
  card: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rankBadge: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  rankText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  candidateEmail: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  explanationText: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceElevated,
    padding: 8,
    borderRadius: 6,
    marginVertical: spacing.xs,
    lineHeight: 16,
  },
  skillSection: {
    marginTop: spacing.xs,
  },
  skillSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
    marginBottom: 4,
  },
  skillSectionTitleWarning: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.warning,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionToolbar: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentStatusLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  statusValue: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  btnRow: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
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
  },
});
