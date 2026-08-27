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

export const ResumeUploadScreen = ({ navigation }: any) => {
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      Alert.alert(
        "Upload Successful",
        "Your resume has been parsed! Please review and verify the extracted skills."
      );
      navigation.navigate("ResumeReview", { resume });
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not process resume.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Resume Management</Text>
          <Text style={styles.subTitle}>
            Upload your text-based PDF or DOCX resume to activate AI job matching.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : activeResume ? (
          <View style={styles.activeCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active Resume</Text>
            </View>
            <Text style={styles.fileName}>{activeResume.file_name}</Text>
            <Text style={styles.metaText}>
              Extracted Skills: {activeResume.parsed_data?.skills?.length || 0}
            </Text>

            <View style={styles.skillTags}>
              {activeResume.parsed_data?.skills?.slice(0, 8).map((skill, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
              {(activeResume.parsed_data?.skills?.length || 0) > 8 && (
                <View style={styles.tagMore}>
                  <Text style={styles.tagMoreText}>
                    +{(activeResume.parsed_data?.skills?.length || 0) - 8} more
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => navigation.navigate("ResumeReview", { resume: activeResume })}
            >
              <Text style={styles.reviewButtonText}>Review & Edit Skills</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Resume Uploaded Yet</Text>
            <Text style={styles.emptySub}>
              Upload your CV to unlock personalized OJT and internship recommendations.
            </Text>
          </View>
        )}

        <View style={styles.uploadBox}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.disabledButton]}
            onPress={handlePickDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadButtonText}>
                {activeResume ? "Upload New Version" : "Select Resume (PDF / DOCX)"}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.noteText}>
            Maximum file size: 5MB. Text-based files only (scanned photos not supported).
          </Text>
        </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subTitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
    lineHeight: 20,
  },
  activeCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 24,
  },
  badge: {
    backgroundColor: "#065F46",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    color: "#34D399",
    fontSize: 12,
    fontWeight: "700",
  },
  fileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  metaText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    marginBottom: 14,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  tagText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  tagMore: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: "center",
  },
  tagMoreText: {
    color: "#818CF8",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewButton: {
    backgroundColor: "#1E1B4B",
    borderColor: "#6366F1",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  reviewButtonText: {
    color: "#A5B4FC",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  uploadBox: {
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#6366F1",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  noteText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
});
