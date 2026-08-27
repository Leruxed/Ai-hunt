import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { api } from "../../api/client";
import { Application, ApplicationStatus } from "../../types";

const STAGES: { key: ApplicationStatus; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Review" },
  { key: "shortlisted", label: "Shortlist" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "accepted", label: "Decision" },
];

const STATUS_STAGE_MAP: Record<ApplicationStatus, number> = {
  submitted: 0,
  under_review: 1,
  shortlisted: 2,
  interview_scheduled: 3,
  accepted: 4,
  rejected: 4,
  withdrawn: -1,
};

export const ApplicationTrackerScreen: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const data = await api.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, []);

  const renderStepper = (status: ApplicationStatus) => {
    if (status === "withdrawn") {
      return (
        <View style={styles.terminalBanner}>
          <Text style={styles.withdrawnText}>Application Withdrawn</Text>
        </View>
      );
    }

    if (status === "rejected") {
      return (
        <View style={styles.rejectedBanner}>
          <Text style={styles.rejectedText}>Position Closed / Not Selected</Text>
        </View>
      );
    }

    const currentStageIdx = STATUS_STAGE_MAP[status] ?? 0;

    return (
      <View style={styles.stepperContainer}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIdx;
          const isCurrent = idx === currentStageIdx;

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      (isCompleted || isCurrent) && styles.stepNumberActive,
                    ]}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                >
                  {stage.label}
                </Text>
              </View>
              {idx < STAGES.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    idx < currentStageIdx && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderApplicationItem = ({ item }: { item: Application }) => {
    const appliedDate = new Date(item.applied_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.appliedDate}>Applied on {appliedDate}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {item.status.replace("_", " ").toUpperCase()}
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

        {/* Visual Progress Stepper */}
        {renderStepper(item.status)}

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchApplications();
              }}
              tintColor="#6366F1"
            />
          }
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
    paddingTop: 54,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
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
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
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
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCompleted: {
    backgroundColor: "#059669",
    borderColor: "#10B981",
  },
  stepCircleCurrent: {
    backgroundColor: "#4F46E5",
    borderColor: "#818CF8",
  },
  stepNumber: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  stepNumberActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  stepLabelCompleted: {
    color: "#10B981",
    fontWeight: "600",
  },
  stepLabelCurrent: {
    color: "#818CF8",
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#1E293B",
    marginHorizontal: 2,
    marginBottom: 14,
  },
  stepLineCompleted: {
    backgroundColor: "#059669",
  },
  rejectedBanner: {
    backgroundColor: "#450A0A",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  rejectedText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "600",
  },
  terminalBanner: {
    backgroundColor: "#18181B",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  withdrawnText: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  notesText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
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
