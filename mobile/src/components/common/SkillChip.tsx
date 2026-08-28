import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface SkillChipProps {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "matched" | "missing";
}

export const SkillChip: React.FC<SkillChipProps> = ({
  label,
  onRemove,
  variant = "default",
}) => {
  let bg = colors.surfaceElevated;
  let border = colors.borderIndigo;
  let text = colors.primaryLight;

  if (variant === "matched") {
    bg = colors.successBg;
    border = colors.successBorder;
    text = colors.success;
  } else if (variant === "missing") {
    bg = colors.warningBg;
    border = colors.warningBorder;
    text = colors.warning;
  }

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeBtn}
        >
          <Text style={styles.removeIcon}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeBtn: {
    marginLeft: 6,
    paddingHorizontal: 2,
  },
  removeIcon: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 14,
  },
});
