import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { api } from "../../api/client";
import { Application, ApplicationStatus } from "../../types";

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  submitted: { bg: "#1E293B", text: "#94A3B8" },
  under_review: { bg: "#1E1B4B", text: "#A5B4FC" },
  shortlisted: { bg: "#064E3B", text: "#6EE7B7" },
  interview_scheduled: { bg: "#78350F", text: "#FCD34D" },
  accepted: { bg: "#065F46", text: "#34D399" },
  rejected: { bg: "#7F1D1D", text: "#FCA5A5" },
  withdrawn: { bg: "#18181B", text: "#71717A" },
};

export const ApplicationTrackerScreen = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const renderApplicationItem = ({ item }: { item: Application }) => {
    const statusMeta = STATUS_COLORS[item.status] || STATUS_COLORS.submitted;
    const formattedStatus = item.status.replace("_", " ").toUpperCase();
    const appliedDate = new Date(item.applied_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.appliedDate}>Applied on {appliedDate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.text }]}>
              {formattedStatus}
            </Text>
          </View>
        </View>

        <Text style={styles.jobTitle}>
          {item.job_posting?.title || "Internship Position"}
        </Text>
        <Text style={styles.companyName}>
          {item.job_posting?.employer?.company_name || "Partner Company"} •{" "}
          {item.job_posting?.location || "Metro Manila"}
        </Text>

        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            Note: "{item.notes}"
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Applications</Text>
        <Text style={styles.subTitle}>
          Track real-time hiring progress and employer review updates.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplicationItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchApplications}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptyText}>
                Explore the Recommendations tab and apply to positions matching your profile!
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
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#131C2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appliedDate: {
    color: "#64748B",
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  companyName: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  notesText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
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
    lineHeight: 18,
  },
});
