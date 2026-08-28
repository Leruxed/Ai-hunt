import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface ScoreBadgeProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  size?: number;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 42 }) => {
  const percentage = score <= 1.0 ? Math.round(score * 100) : Math.round(score);

  let bg = colors.surfaceElevated;
  let borderColor = colors.textSubtle;
  let textColor = colors.textSubtle;

  if (percentage >= 80) {
    bg = colors.successBg;
    borderColor = colors.success;
    textColor = colors.success;
  } else if (percentage >= 60) {
    bg = colors.warningBg;
    borderColor = colors.warning;
    textColor = colors.warning;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: borderColor,
        },
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
