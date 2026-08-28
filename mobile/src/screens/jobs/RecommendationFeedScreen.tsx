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
  RefreshControl,
} from "react-native";
import { api } from "../../api/client";
import { RecommendationItem, JobPosting, ExternalJob } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";
import { ScoreBadge } from "../../components/common/ScoreBadge";

export const RecommendationFeedScreen = ({ navigation }: any) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchRecommendations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const items = await api.getRecommendations();
      setRecommendations(items);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("upload")) {
        Alert.alert(
          "Resume Required",
          "Please upload your resume first to activate AI job and internship recommendations.",
          [
            {
              text: "Upload Resume",
              onPress: () => navigation.navigate("ResumeTab"),
            },
          ]
        );
      } else {
        Alert.alert("Notice", err.message || "Could not load opportunities.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = async (item: RecommendationItem) => {
    if (item.target_type === "external") {
      const extJob = item.target as ExternalJob;
      if (extJob.apply_url) {
        Linking.openURL(extJob.apply_url);
      }
      return;
    }

    const job = item.target as JobPosting;
    setApplyingId(job.id);
    try {
      await api.applyToJob(job.id, "Applied via AI Recommendation Feed");
      Alert.alert(
        "Application Submitted",
        `You have successfully applied to ${job.title}! Track your progress in the Applications tab.`
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

    const companyName = isInternal
      ? (job as JobPosting).employer?.company_name || "Verified Employer"
      : (job as ExternalJob).company_name;

    const locationText = job.location ? ` · ${job.location}` : "";
    const jobTypeLabel = isInternal
      ? (job as JobPosting).job_type === "internship"
        ? "Internship"
        : (job as JobPosting).job_type === "ojt"
        ? "OJT"
        : "Full-time"
      : "Opportunity";

    const sourceLabel = isInternal
      ? "via app"
      : `via ${(job as ExternalJob).source || "JSearch"}`;

    const matchedSkills = item.explanation?.matched_skills || [];
    const missingSkills = item.explanation?.missing_skills || [];

    return (
      <Card style={styles.card}>
        {/* Top Header: Badge + Job Info matching mockup */}
        <View style={styles.topRow}>
          <ScoreBadge score={matchPercentage} size={42} />

          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.companyLocation}>
              {companyName}
              {locationText}
            </Text>

            {/* Tag Pills matching mockup */}
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{jobTypeLabel}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{sourceLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Skill Match Breakdown matching mockup */}
        {matchedSkills.length > 0 && (
          <View style={styles.skillOkRow}>
            <Text style={styles.skillOkText}>
              ✓ {matchedSkills.join(", ")}
            </Text>
          </View>
        )}

        {missingSkills.length > 0 && (
          <View style={styles.skillMissRow}>
            <Text style={styles.skillMissText}>
              Missing: {missingSkills.join(", ")}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.applyButton,
            isInternal ? styles.applyButtonInternal : styles.applyButtonExternal,
            applyingId === job.id && styles.applyButtonDisabled,
          ]}
          onPress={() => handleApply(item)}
          disabled={applyingId === job.id}
        >
          {applyingId === job.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.applyButtonText}>
              {isInternal ? "Apply via App" : "Apply on Web ↗"}
            </Text>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Opportunities</Text>
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => fetchRecommendations(true)}
          >
            <Text style={styles.filterIcon}>⚡</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Internal postings + external listings</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Ranking opportunities with AI...</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) => `${item.target_type}-${(item.target as any).id || index}`}
          renderItem={renderRecommendationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRecommendations(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Opportunities Found</Text>
              <Text style={styles.emptySub}>
                Upload or update your resume skills to see tailored recommendations.
              </Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => navigation.navigate("ResumeTab")}
              >
                <Text style={styles.uploadBtnText}>Upload / Edit Resume</Text>
              </TouchableOpacity>
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  filterIconBtn: {
    padding: spacing.xs,
  },
  filterIcon: {
    fontSize: 18,
  },
  subtitle: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  card: {
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 18,
  },
  companyLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  tagText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: "500",
  },
  skillOkRow: {
    marginTop: 10,
  },
  skillOkText: {
    fontSize: 11.5,
    color: colors.success,
    fontWeight: "500",
  },
  skillMissRow: {
    marginTop: 3,
  },
  skillMissText: {
    fontSize: 11.5,
    color: colors.warning,
    fontWeight: "500",
  },
  applyButton: {
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: spacing.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonInternal: {
    backgroundColor: colors.primary,
  },
  applyButtonExternal: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  applyButtonDisabled: {
    opacity: 0.65,
  },
  applyButtonText: {
    color: "#FFFFFF",
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
  uploadBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.radiusMd,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
