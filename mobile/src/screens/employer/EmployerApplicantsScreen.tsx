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
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { api } from "../../api/client";
import { RankedApplicant, ApplicationStatus } from "../../types";

const STATUS_ACTIONS: { label: string; status: ApplicationStatus; color: string }[] = [
  { label: "Shortlist", status: "shortlisted", color: "#6366f1" },
  { label: "Interview", status: "interview_scheduled", color: "#3b82f6" },
  { label: "Accept", status: "accepted", color: "#10b981" },
  { label: "Reject", status: "rejected", color: "#ef4444" },
];

export const EmployerApplicantsScreen: React.FC = () => {
  const route = useRoute<any>();
  const { postingId, postingTitle } = route.params || {};

  const [applicants, setApplicants] = useState<RankedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplicants = async () => {
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
      Alert.alert("Status Updated", `Candidate status changed to ${newStatus.replace("_", " ")}.`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update candidate status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "#10b981";
    if (pct >= 60) return "#6366f1";
    return "#f59e0b";
  };

  const renderApplicantCard = ({ item, index }: { item: RankedApplicant; index: number }) => {
    const matchPct = Math.round(item.match_score * 100);
    const scoreColor = getScoreColor(matchPct);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.candidateName}>{item.candidate_name}</Text>
            <Text style={styles.candidateEmail}>{item.candidate_email}</Text>
          </View>
          <View style={[styles.matchScoreBadge, { backgroundColor: scoreColor + "20", borderColor: scoreColor }]}>
            <Text style={[styles.matchScoreText, { color: scoreColor }]}>{matchPct}% Match</Text>
          </View>
        </View>

        {/* Explainability Summary */}
        <Text style={styles.explanationText}>{item.explanation.summary}</Text>

        {/* Skills Breakdown */}
        {item.explanation.matched_skills.length > 0 && (
          <View style={styles.skillSection}>
            <Text style={styles.skillSectionTitle}>Matched Skills ({item.explanation.matched_skills.length}):</Text>
            <View style={styles.chipRow}>
              {item.explanation.matched_skills.map((skill) => (
                <View key={skill} style={styles.matchedChip}>
                  <Text style={styles.matchedChipText}>✓ {skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.explanation.missing_skills.length > 0 && (
          <View style={styles.skillSection}>
            <Text style={styles.skillSectionTitle}>Missing Skills ({item.explanation.missing_skills.length}):</Text>
            <View style={styles.chipRow}>
              {item.explanation.missing_skills.map((skill) => (
                <View key={skill} style={styles.missingChip}>
                  <Text style={styles.missingChipText}>- {skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Current Status & Action Bar */}
        <View style={styles.statusSection}>
          <Text style={styles.currentStatusLabel}>
            Status: <Text style={styles.statusValue}>{item.status.replace("_", " ").toUpperCase()}</Text>
          </Text>

          <View style={styles.actionRow}>
            {STATUS_ACTIONS.map((action) => {
              const isActive = item.status === action.status;
              return (
                <TouchableOpacity
                  key={action.status}
                  style={[
                    styles.actionButton,
                    isActive && { backgroundColor: action.color, borderColor: action.color },
                  ]}
                  disabled={updatingId === item.application_id}
                  onPress={() => handleStatusUpdate(item, action.status)}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      isActive && styles.activeActionButtonText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ranked Applicants</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>{postingTitle || "Job Applicants"}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Ranking candidates with AI...</Text>
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
              onRefresh={() => {
                setRefreshing(true);
                fetchApplicants();
              }}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Applicants Yet</Text>
              <Text style={styles.emptySubtitle}>
                Candidates matching your job requirements will appear here ranked by AI relevance.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rankText: {
    color: "#6366f1",
    fontWeight: "700",
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  candidateEmail: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  matchScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchScoreText: {
    fontWeight: "700",
    fontSize: 12,
  },
  explanationText: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 12,
  },
  skillSection: {
    marginBottom: 8,
  },
  skillSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  matchedChip: {
    backgroundColor: "#064e3b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchedChipText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "500",
  },
  missingChip: {
    backgroundColor: "#450a0a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missingChipText: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "500",
  },
  statusSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  currentStatusLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  statusValue: {
    fontWeight: "700",
    color: "#38bdf8",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  activeActionButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
