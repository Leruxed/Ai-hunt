import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { api } from "../../api/client";
import { Resume } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { SkillChip } from "../../components/common/SkillChip";

// Skill categorizer utility for clean taxonomy presentation
const CATEGORY_MAP: Record<string, string[]> = {
  LANGUAGES: [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "HTML", "CSS", "SQL"
  ],
  FRAMEWORKS: [
    "FastAPI", "React", "React Native", "Node.js", "Express", "Django", "Flask", "Spring", "Angular", "Vue", "Next.js", "TailwindCSS"
  ],
  DATABASES: [
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite", "Supabase", "Firebase", "Elasticsearch", "Oracle"
  ],
};

export const ResumeReviewScreen = ({ route, navigation }: any) => {
  const initialResume: Resume = route.params?.resume;
  const [skills, setSkills] = useState<string[]>(
    initialResume?.parsed_data?.skills || []
  );
  const [newSkillText, setNewSkillText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Notice", "This skill is already included.");
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkillText("");
  };

  const handleSave = async () => {
    if (!initialResume) return;
    setSaving(true);
    try {
      const updatedParsedData = {
        ...initialResume.parsed_data,
        skills,
      };

      await api.updateParsedResume(initialResume.id, updatedParsedData);
      Alert.alert(
        "Profile Activated",
        "Your skills have been verified and your AI match profile is now active!",
        [
          {
            text: "View Matched Opportunities",
            onPress: () => navigation.navigate("Recommendations"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Save Error", err.message || "Failed to update skills.");
    } finally {
      setSaving(false);
    }
  };

  // Group skills into category buckets
  const categorizeSkills = () => {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const databases: string[] = [];
    const others: string[] = [];

    skills.forEach((s) => {
      if (CATEGORY_MAP.LANGUAGES.some((c) => c.toLowerCase() === s.toLowerCase())) {
        languages.push(s);
      } else if (CATEGORY_MAP.FRAMEWORKS.some((c) => c.toLowerCase() === s.toLowerCase())) {
        frameworks.push(s);
      } else if (CATEGORY_MAP.DATABASES.some((c) => c.toLowerCase() === s.toLowerCase())) {
        databases.push(s);
      } else {
        others.push(s);
      }
    });

    return { languages, frameworks, databases, others };
  };

  const categorized = categorizeSkills();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header matching mockup */}
        <View style={styles.header}>
          <Text style={styles.title}>Review your skills</Text>
          <Text style={styles.subtitle}>Remove anything that's off, add what's missing</Text>
        </View>

        {/* Group: LANGUAGES */}
        {categorized.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categoryHeader}>LANGUAGES</Text>
            <View style={styles.chipRow}>
              {categorized.languages.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Group: FRAMEWORKS */}
        {categorized.frameworks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categoryHeader}>FRAMEWORKS</Text>
            <View style={styles.chipRow}>
              {categorized.frameworks.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Group: DATABASES */}
        {categorized.databases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categoryHeader}>DATABASES</Text>
            <View style={styles.chipRow}>
              {categorized.databases.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Group: TOOLS & OTHER SKILLS */}
        {categorized.others.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categoryHeader}>OTHER TOOLS & COMPETENCIES</Text>
            <View style={styles.chipRow}>
              {categorized.others.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Add Skill Input matching mockup */}
        <View style={styles.addSkillContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Add a skill..."
            placeholderTextColor={colors.textDisabled}
            value={newSkillText}
            onChangeText={setNewSkillText}
            onSubmitEditing={handleAddSkill}
            returnKeyType="done"
          />
          {newSkillText.length > 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={handleAddSkill}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Full-width save & activate CTA button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save & activate profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    ...typography.categoryHeader,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  addSkillContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    height: 44,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.radiusSm,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
