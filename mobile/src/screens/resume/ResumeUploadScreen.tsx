import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../api/client";
import { Resume } from "../../types";
import { colors, typography, spacing } from "../../theme";
import { Card } from "../../components/common/Card";
import { SkillChip } from "../../components/common/SkillChip";

export const ResumeUploadScreen = ({ navigation }: any) => {
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const fetchCurrentResume = async () => {
    setLoading(true);
    try {
      const res = await api.getMyResume();
      setActiveResume(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentResume();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        uploadFile(file);
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err.message || "Failed to pick file.");
    }
  };

  const uploadFile = async (fileAsset: any) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || "application/pdf",
      } as any);

      const resume = await api.uploadResume(formData);
      setActiveResume(resume);
      setSelectedFile(null);
      Alert.alert(
        "Upload Successful",
        "Your resume has been parsed by AI! Please verify the extracted skills."
      );
      navigation.navigate("ResumeReview", { resume });
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not process resume.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Selected";
    const kb = Math.round(bytes / 1024);
    return `${kb} KB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header matching mockup */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload your resume</Text>
          <Text style={styles.subtitle}>PDF or DOCX, up to 5MB</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
        ) : activeResume ? (
          <Card style={styles.activeCard}>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Active Resume Profile</Text>
              </View>
            </View>

            <Text style={styles.fileName}>{activeResume.file_name}</Text>
            <Text style={styles.metaText}>
              Extracted Skills ({activeResume.parsed_data?.skills?.length || 0})
            </Text>

            <View style={styles.skillsRow}>
              {activeResume.parsed_data?.skills?.slice(0, 7).map((skill, idx) => (
                <SkillChip key={idx} label={skill} />
              ))}
              {(activeResume.parsed_data?.skills?.length || 0) > 7 && (
                <View style={styles.moreChip}>
                  <Text style={styles.moreChipText}>
                    +{(activeResume.parsed_data?.skills?.length || 0) - 7} more
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate("ResumeReview", { resume: activeResume })}
            >
              <Text style={styles.reviewBtnText}>Review & Edit Extracted Skills</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Upload Zone / Drop Area matching mockup */}
        <TouchableOpacity
          style={[styles.dropZone, uploading && styles.dropZoneDisabled]}
          onPress={handlePickDocument}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <View style={styles.uploadIconContainer}>
            <Text style={styles.uploadIcon}>☁️</Text>
          </View>
          <Text style={styles.dropTitle}>
            {selectedFile ? selectedFile.name : activeResume ? "Upload New Version" : "Select Resume File"}
          </Text>
          <Text style={styles.dropSub}>
            {selectedFile
              ? `${formatFileSize(selectedFile.size)} · selected`
              : "Tap to browse PDF or DOCX documents"}
          </Text>
        </TouchableOpacity>

        {/* Mid-Parse Progress Card matching mockup */}
        {uploading && (
          <Card style={styles.parsingCard}>
            <View style={styles.parsingHeader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.parsingText}>Extracting skills, education, experience...</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </Card>
        )}

        {/* Main CTA Button matching mockup */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            uploading && styles.ctaButtonDisabled,
            activeResume && !uploading && styles.ctaButtonSecondary,
          ]}
          onPress={handlePickDocument}
          disabled={uploading}
        >
          <Text style={styles.ctaButtonText}>
            {uploading
              ? "Parsing resume..."
              : activeResume
              ? "Replace Resume"
              : "Choose Document"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Text-based files only. Magic-byte protected under RA 10173 Data Privacy compliance.
        </Text>
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
    marginBottom: spacing.lg,
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
  activeCard: {
    marginBottom: spacing.xl,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  metaText: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  moreChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  moreChipText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  reviewBtn: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    paddingVertical: 10,
    alignItems: "center",
  },
  reviewBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  dropZone: {
    borderWidth: 1.5,
    borderColor: colors.borderDashed,
    borderStyle: "dashed",
    borderRadius: spacing.radiusLg,
    paddingVertical: 26,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(67, 56, 202, 0.05)",
    marginBottom: spacing.lg,
  },
  dropZoneDisabled: {
    opacity: 0.6,
  },
  uploadIconContainer: {
    marginBottom: spacing.sm,
  },
  uploadIcon: {
    fontSize: 28,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: "center",
  },
  dropSub: {
    ...typography.muted,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: "center",
  },
  parsingCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  parsingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  parsingText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: {
    height: "100%",
    width: "75%",
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ctaButtonDisabled: {
    opacity: 0.65,
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 11,
    color: colors.textSubtle,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 15,
  },
});
