import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { api } from "../../api/client";
import { Resume } from "../../types";

export const ResumeReviewScreen = ({ route, navigation }: any) => {
  const { resume } = route.params as { resume: Resume };
  const [skills, setSkills] = useState<string[]>(
    resume.parsed_data?.skills || []
  );
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      Alert.alert("Duplicate Skill", "This skill is already in your list.");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveAndActivate = async () => {
    setSaving(true);
    try {
      const updatedParsedData = {
        ...(resume.parsed_data || {}),
        skills,
      };
      await api.updateParsedResume(resume.id, updatedParsedData);
      Alert.alert(
        "Resume Activated",
        "Your skills have been confirmed and active matching is enabled!"
      );
      navigation.navigate("Recommendations");
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Could not update skills.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Extracted Skills</Text>
          <Text style={styles.subTitle}>
            Review the skills extracted from your resume. You can add or remove any skills to fine-tune your recommendations.
          </Text>
        </View>

        {/* Add Skill Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Docker, Next.js, Figma"
            placeholderTextColor="#64748B"
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={handleAddSkill}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Extracted Skills List */}
        <Text style={styles.sectionHeader}>Confirmed Skills ({skills.length})</Text>
        <View style={styles.chipContainer}>
          {skills.map((skill, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText}>{skill}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveSkill(skill)}
                style={styles.chipClose}
              >
                <Text style={styles.chipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {skills.length === 0 && (
            <Text style={styles.emptyText}>
              No skills selected. Please add at least one skill.
            </Text>
          )}
        </View>

        {/* Save and Confirm Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSaveAndActivate}
          disabled={saving || skills.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Confirm & Find Matching Jobs</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subTitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#1E1B4B",
    borderColor: "#6366F1",
    borderWidth: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 10,
  },
  addButtonText: {
    color: "#A5B4FC",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E2E8F0",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#131C2E",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    minHeight: 120,
    marginBottom: 24,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#475569",
  },
  chipText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  chipClose: {
    padding: 2,
  },
  chipCloseText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    marginVertical: 20,
    textAlign: "center",
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
