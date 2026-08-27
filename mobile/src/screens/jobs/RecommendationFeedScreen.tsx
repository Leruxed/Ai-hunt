import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Linking,
} from "react-native";
import { api } from "../../api/client";
import { RecommendationItem, JobPosting, ExternalJob } from "../../types";

export const RecommendationFeedScreen = ({ navigation }: any) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const items = await api.getRecommendations();
      setRecommendations(items);
    } catch (err: any) {
      if (err.message.includes("upload")) {
        // Prompt to upload resume first
        Alert.alert(
          "Resume Required",
          "Please upload your resume to generate tailored job and OJT matches.",
          [
            {
              text: "Upload Resume",
              onPress: () => navigation.navigate("ResumeTab"),
            },
          ]
        );
      } else {
        Alert.alert("Error", err.message || "Could not fetch recommendations.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = async (item: RecommendationItem) => {
    if (item.target_type === "external") {
      const extJob = item.target as ExternalJob;
      Linking.openURL(extJob.apply_url);
      return;
    }

    const job = item.target as JobPosting;
    setApplyingId(job.id);
    try {
      await api.applyToJob(job.id, "Applied via SkillMatch AI Recommendations");
      Alert.alert(
        "Application Submitted",
        `You have successfully applied for ${job.title}! Track status in the Applications tab.`
      );
    } catch (err: any) {
      Alert.alert("Application Notice", err.message || "Failed to submit application.");
    } finally {
      setApplyingId(null);
    }
  };

  const renderRecommendationCard = ({ item }: { item: RecommendationItem }) => {
    const isInternal = item.target_type === "internal";
    const job = item.target as JobPosting & ExternalJob;
    const matchPercentage = Math.round(item.match_score * 100);

    const scoreColor =
      matchPercentage >= 80 ? "#10B981" : matchPercentage >= 60 ? "#F59E0B" : "#64748B";

    return (
      <View style={styles.card}>
        {/* Header with Source Badge and Match Score */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.sourceBadge,
                isInternal ? styles.internalBadge : styles.externalBadge,
              ]}
            >
              <Text
                style={[
                  styles.sourceBadgeText,
                  isInternal ? styles.internalBadgeText : styles.externalBadgeText,
                ]}
              >
                {isInternal ? "Internal Posting" : `External (${item.target.source || "Web"})`}
              </Text>
            </View>
          </View>

          <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {matchPercentage}% MATCH
            </Text>
          </View>
        </View>

        {/* Title and Company */}
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.companyName}>
          {isInternal
            ? (job as JobPosting).employer?.company_name || "Verified Partner"
            : (job as ExternalJob).company_name}
          {job.location ? ` • ${job.location}` : ""}
        </Text>

        {/* AI Match Explanation Box */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationSummary}>{item.explanation.summary}</Text>

          {item.explanation.matched_skills.length > 0 && (
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Matched:</Text>
              <View style={styles.chipsWrap}>
                {item.explanation.matched_skills.map((skill, idx) => (
                  <View key={idx} style={styles.matchedChip}>
                    <Text style={styles.matchedChipText}>✓ {skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.explanation.missing_skills.length > 0 && (
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Missing:</Text>
              <View style={styles.chipsWrap}>
                {item.explanation.missing_skills.map((skill, idx) => (
                  <View key={idx} style={styles.missingChip}>
                    <Text style={styles.missingChipText}>- {skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.applyButton, isInternal ? styles.internalApply : styles.externalApply]}
          onPress={() => handleApply(item)}
          disabled={applyingId === job.id}
        >
          {applyingId === job.id ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.applyButtonText}>
              {isInternal ? "Apply Now" : "Apply on External Site ↗"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for You</Text>
        <Text style={styles.subTitle}>
          Ranked by multi-factor AI matching against your active resume.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Scoring postings against your profile...</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) => `${item.target_type}-${item.target.id || index}`}
          renderItem={renderRecommendationCard}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchRecommendations}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Opportunities Found</Text>
              <Text style={styles.emptyText}>
                Pull down to refresh or update your skills in the Resume tab.
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
    backgroundColor: "#090D16",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subTitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  internalBadge: {
    backgroundColor: "#1E1B4B",
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  internalBadgeText: {
    color: "#A5B4FC",
    fontSize: 11,
    fontWeight: "700",
  },
  externalBadge: {
    backgroundColor: "#1C1917",
    borderWidth: 1,
    borderColor: "#78716C",
  },
  externalBadgeText: {
    color: "#D6D3D1",
    fontSize: 11,
    fontWeight: "700",
  },
  scoreBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#0B111E",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "800",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  companyName: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 3,
    marginBottom: 12,
  },
  explanationBox: {
    backgroundColor: "#0B111E",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  explanationSummary: {
    fontSize: 13,
    color: "#CBD5E1",
    fontWeight: "600",
    marginBottom: 8,
  },
  skillRow: {
    marginTop: 6,
  },
  skillLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  matchedChip: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchedChipText: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "600",
  },
  missingChip: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missingChipText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "600",
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  internalApply: {
    backgroundColor: "#6366F1",
  },
  externalApply: {
    backgroundColor: "#334155",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});
