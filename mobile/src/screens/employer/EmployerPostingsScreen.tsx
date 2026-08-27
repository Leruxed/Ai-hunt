import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../api/client";
import { JobPosting, JobType } from "../../types";

export const EmployerPostingsScreen = () => {
  const navigation = useNavigation<any>();
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPostings();
      setPostings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const handleCreatePosting = async () => {
    if (!title || !description) {
      Alert.alert("Validation Error", "Please provide a job title and description.");
      return;
    }
    setCreating(true);
    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createJobPosting({
        title,
        description,
        location: location || "Metro Manila",
        job_type: "internship" as JobType,
        required_skills: skillsArray,
      });

      setModalVisible(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setRequiredSkills("");
      fetchPostings();
      Alert.alert("Success", "Job posting published!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create posting.");
    } finally {
      setCreating(false);
    }
  };

  const renderPostingItem = ({ item }: { item: JobPosting }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.posted_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.locationText}>{item.location || "Remote"}</Text>

      <View style={styles.skillsWrap}>
        {item.required_skills.map((skill, idx) => (
          <View key={idx} style={styles.skillChip}>
            <Text style={styles.skillChipText}>{skill}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewApplicantsButton}
        onPress={() =>
          navigation.navigate("EmployerApplicants", {
            postingId: item.id,
            postingTitle: item.title,
          })
        }
      >
        <Text style={styles.viewApplicantsButtonText}>👥 View Ranked Applicants →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Employer Portal</Text>
          <Text style={styles.subTitle}>Manage postings and recruit qualified interns</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newButtonText}>+ Post Job</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={postings}
          keyExtractor={(item) => item.id}
          renderItem={renderPostingItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchPostings}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Active Postings</Text>
              <Text style={styles.emptyText}>
                Tap "+ Post Job" to publish a new internship or OJT opportunity.
              </Text>
            </View>
          }
        />
      )}

      {/* Create Job Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create Internship Posting</Text>

              <Text style={styles.label}>Job / Internship Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Frontend Developer Intern"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bonifacio Global City, Taguig"
                placeholderTextColor="#64748B"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.label}>Required Skills (Comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. React, TypeScript, Git, Tailwind"
                placeholderTextColor="#64748B"
                value={requiredSkills}
                onChangeText={setRequiredSkills}
              />

              <Text style={styles.label}>Description & Responsibilities</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe role objectives and learning outcomes..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, creating && styles.disabledButton]}
                  onPress={handleCreatePosting}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Publish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subTitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  newButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  newButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#131C2E",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: "#065F46",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "700",
  },
  dateText: {
    color: "#64748B",
    fontSize: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  locationText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  skillChip: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillChipText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  viewApplicantsButton: {
    backgroundColor: "#1e1b4b",
    borderWidth: 1,
    borderColor: "#6366f1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  viewApplicantsButtonText: {
    color: "#a5b4fc",
    fontWeight: "700",
    fontSize: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#0B111E",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  cancelButtonText: {
    color: "#CBD5E1",
    fontWeight: "700",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#6366F1",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
