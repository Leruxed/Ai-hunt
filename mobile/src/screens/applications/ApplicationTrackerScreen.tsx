import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { api } from "../../api/client";
import { Application } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";
import { StatusStepper } from "../../components/common/StatusStepper";

export const ApplicationTrackerScreen = ({ navigation }: any) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      console.error("Fetch applications failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const formatRelativeTime = (isoDate?: string) => {
    if (!isoDate) return "recently";
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "today";
      if (diffDays === 1) return "yesterday";
      return `${diffDays} days ago`;
    } catch {
      return "recently";
    }
  };

  const renderApplicationCard = ({ item }: { item: Application }) => {
    const jobTitle = item.job_posting?.title || "Position Applied";
    const companyName =
      item.job_posting?.employer?.company_name || "Partner Company";
    const updatedTime = formatRelativeTime(item.applied_at);

    return (
      <Card style={styles.card}>
        <Text style={styles.jobTitle}>{jobTitle}</Text>
        <Text style={styles.companyMeta}>
          {companyName} · updated {updatedTime}
        </Text>

        {/* 5-Step Connected Progress Line matching mockup */}
        <StatusStepper status={item.status} />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your applications</Text>
        <Text style={styles.subtitle}>
          Track real-time recruitment milestones across internal positions
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplicationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApplications(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptySub}>
                Browse AI-matched opportunities and apply with one tap.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate("Recommendations")}
              >
                <Text style={styles.exploreBtnText}>Explore Opportunities</Text>
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
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  card: {
    padding: 14,
    marginBottom: 14,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  companyMeta: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
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
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.radiusMd,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
