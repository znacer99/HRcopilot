import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "http://102.213.182.101:5000";

export default function CandidateDetailScreen({ route }) {
  const { candidate } = route.params || {};

  if (!candidate) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No candidate data found.</Text>
      </View>
    );
  }

  const openDocument = (relativePath) => {
    if (!relativePath) {
      console.log("No file path provided");
      return;
    }

    // backend stores something like: "candidates/FILE.pdf"
    const url = `${BASE_URL}/static/${relativePath}`;
    console.log("Opening document:", url);
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* HEADER CARD */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={38} color="#2563eb" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{candidate.full_name}</Text>
          <Text style={styles.nationality}>
            {candidate.nationality || "No nationality"}
          </Text>
        </View>
      </View>

      {/* STATUS */}
      <View
        style={[
          styles.statusBadge,
          styles[`status_${candidate.status}`] || styles.status_default,
        ]}
      >
        <Text style={styles.statusText}>
          {(candidate.status || "Unknown").toUpperCase()}
        </Text>
      </View>

      {/* MAIN INFO CARD */}
      <View style={styles.card}>
        <SectionTitle icon="briefcase" title="Job Information" />

        <Info label="Position Applied" value={candidate.applied_position} />
        <Info label="Specialty" value={candidate.specialty} />
        <Info
          label="Department"
          value={candidate.department?.name || "Not assigned"}
        />
        <Info label="Experience" value={candidate.experience} />
        <Info label="Education" value={candidate.education} />
      </View>

      {/* CONTACT CARD */}
      <View style={styles.card}>
        <SectionTitle icon="call" title="Contact Details" />

        <Info label="Email" value={candidate.email} />
        <Info label="Phone" value={candidate.phone} />
      </View>

      {/* SKILLS CARD */}
      <View style={styles.card}>
        <SectionTitle icon="flame" title="Skills" />
        <Text style={styles.value}>
          {candidate.skills || "No skills provided"}
        </Text>
      </View>

      {/* DOCUMENTS CARD */}
      <View style={styles.card}>
        <SectionTitle icon="folder-open" title="Documents" />

        <DocButton
          label="View CV"
          icon="document-text-outline"
          available={candidate.cv_filepath}
          onPress={() => openDocument(candidate.cv_filepath)}
        />

        <DocButton
          label="View ID Document"
          icon="id-card-outline"
          available={candidate.id_document_filepath}
          onPress={() => openDocument(candidate.id_document_filepath)}
        />
      </View>

      {/* TIMELINE CARD */}
      <View style={styles.card}>
        <SectionTitle icon="time-outline" title="Timeline" />

        <Info
          label="Applied On"
          value={candidate.created_at?.substring(0, 10)}
        />
        <Info
          label="Last Update"
          value={candidate.updated_at?.substring(0, 10)}
        />
      </View>
    </ScrollView>
  );
}

/* COMPONENTS */
function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons
        name={icon}
        size={18}
        color="#2563eb"
        style={{ marginRight: 6 }}
      />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "N/A"}</Text>
    </View>
  );
}

function DocButton({ label, icon, available, onPress }) {
  return available ? (
    <TouchableOpacity style={styles.docButton} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#2563eb" />
      <Text style={styles.docText}>{label}</Text>
    </TouchableOpacity>
  ) : (
    <Text style={styles.muted}>No {label} uploaded</Text>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f5f7fa",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    margin: 16,
    borderRadius: 14,
    elevation: 2,
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#e8edff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },

  nationality: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 14,
  },

  /* STATUS BADGE */
  statusBadge: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginTop: -8,
    marginBottom: 8,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  status_new: { backgroundColor: "#3b82f6" },
  status_interviewed: { backgroundColor: "#2563eb" },
  status_hired: { backgroundColor: "#16a34a" },
  status_rejected: { backgroundColor: "#dc2626" },
  status_default: { backgroundColor: "#6b7280" },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 18,
    borderRadius: 14,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },

  infoRow: {
    marginBottom: 12,
  },

  label: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },

  value: {
    fontSize: 16,
    color: "#111",
    marginTop: 3,
  },

  docButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  docText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },

  muted: {
    color: "#9ca3af",
    fontSize: 15,
    marginBottom: 12,
  },

  error: {
    fontSize: 18,
    color: "red",
  },
});
