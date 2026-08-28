import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../../theme";
import { ApplicationStatus } from "../../types";

interface StatusStepperProps {
  status: ApplicationStatus;
}

const STEPS = [
  { key: "submitted", label: "Sub", stepNum: 1 },
  { key: "under_review", label: "Rev", stepNum: 2 },
  { key: "shortlisted", label: "Short", stepNum: 3 },
  { key: "interview_scheduled", label: "Interv", stepNum: 4 },
  { key: "accepted", label: "Accept", stepNum: 5 },
];

const STATUS_ORDER: Record<string, number> = {
  submitted: 1,
  under_review: 2,
  shortlisted: 3,
  interview_scheduled: 4,
  accepted: 5,
};

export const StatusStepper: React.FC<StatusStepperProps> = ({ status }) => {
  const isTerminalNegative = status === "rejected" || status === "withdrawn";
  const currentStep = STATUS_ORDER[status] || 1;

  if (isTerminalNegative) {
    return (
      <View style={styles.terminalContainer}>
        <View style={styles.terminalBadge}>
          <Text style={styles.terminalText}>
            {status === "rejected" ? "Application Declined" : "Application Withdrawn"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isPassed = step.stepNum < currentStep;
          const isCurrent = step.stepNum === currentStep;
          const isUpcoming = step.stepNum > currentStep;

          let dotBg = colors.surfaceElevated;
          let dotBorder = colors.border;
          let textColor = colors.textDisabled;
          let content = `${step.stepNum}`;

          if (isPassed) {
            dotBg = colors.success;
            dotBorder = colors.success;
            textColor = "#052E22";
            content = "✓";
          } else if (isCurrent) {
            dotBg = colors.primary;
            dotBorder = colors.primary;
            textColor = "#FFFFFF";
            content = `${step.stepNum}`;
          }

          const hasNext = idx < STEPS.length - 1;
          const isNextSegmentFilled = isPassed;

          return (
            <React.Fragment key={step.key}>
              <View style={[styles.dot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
                <Text style={[styles.dotText, { color: textColor }]}>{content}</Text>
              </View>
              {hasNext && (
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: isNextSegmentFilled
                        ? colors.success
                        : isCurrent
                        ? colors.primary
                        : colors.surfaceElevated,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {STEPS.map((step) => {
          const isCurrent = step.stepNum === currentStep;
          const isPassed = step.stepNum <= currentStep;
          return (
            <Text
              key={step.key}
              style={[
                styles.label,
                isCurrent && styles.labelCurrent,
                isPassed && styles.labelPassed,
              ]}
            >
              {step.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dotText: {
    fontSize: 10,
    fontWeight: "700",
  },
  segment: {
    flex: 1,
    height: 2.5,
    marginHorizontal: 3,
    borderRadius: 2,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 9,
    color: colors.textDisabled,
    fontWeight: "600",
    textAlign: "center",
    width: 32,
  },
  labelPassed: {
    color: colors.textMuted,
  },
  labelCurrent: {
    color: colors.primaryText,
    fontWeight: "700",
  },
  terminalContainer: {
    marginTop: 12,
  },
  terminalBadge: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  terminalText: {
    color: colors.dangerText,
    fontSize: 12,
    fontWeight: "600",
  },
});
