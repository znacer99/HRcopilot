import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiService, { BASE_URL } from "../api/apiService";

const { width } = Dimensions.get('window');

/**
 * Candidate Detail Screen - Premium Recruitment view
 */
export default function CandidateDetailScreen({ route, navigation }) {
  const { candidate, manage = false } = route.params || {};

  if (!candidate) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text style={styles.errorText}>Lead record synchronization failed.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Return to Pipeline</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openDocument = (relativePath) => {
    if (!relativePath) return;
    const url = `${BASE_URL}/static/${relativePath}`;
    Linking.openURL(url);
  };

  const handleDelete = () => {
    Alert.alert(
      "Purge Record",
      `Are you certain you want to permanently remove ${candidate.full_name} from the recruitment pipeline?`,
      [
        { text: "Retain Lead", style: "cancel" },
        {
          text: "Purge",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiService.deleteCandidate(candidate.id);
              if (res.success) {
                Alert.alert("Success", "Candidate lead purged successfully.");
                navigation.goBack();
              }
            } catch (err) {
              Alert.alert("System Error", "Failed to purge record.");
            }
          }
        }
      ]
    );
  };

  const initials = candidate.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Profile</Text>
          {manage ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("CandidateEdit", { candidate })}
              style={styles.navIconBtn}
            >
              <Ionicons name="create-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{candidate.full_name}</Text>
          <Text style={styles.heroPosition}>{candidate.applied_position || 'Open Role'}</Text>

          <View style={[styles.statusBadge, styles[`status_${candidate.status?.toLowerCase()}`] || styles.status_default]}>
            <Text style={styles.statusText}>{(candidate.status || "NEW").toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.modulesContainer}>
          {/* CORE QUALIFICATIONS */}
          <DetailModule title="Qualifications" icon="ribbon" color="#3b82f6">
            <InfoRow label="Specialty" value={candidate.specialty} />
            <InfoRow label="Experience" value={candidate.experience} />
            <InfoRow label="Education" value={candidate.education} />
            <InfoRow label="Dept/Unit" value={candidate.department?.name || "Unassigned"} />
          </DetailModule>

          {/* CONTACT CHANNEL */}
          <DetailModule title="Contact Channels" icon="call" color="#10b981">
            <InfoRow label="Email Identity" value={candidate.email} isCopyable />
            <InfoRow label="Mobile Line" value={candidate.phone} isCopyable />
            <InfoRow label="Nationality" value={candidate.nationality} />
          </DetailModule>

          {/* SKILLS ARCHIVE */}
          <DetailModule title="Skill Repository" icon="flash" color="#f59e0b">
            <Text style={styles.longText}>{candidate.skills || "No descriptive skills provided."}</Text>
          </DetailModule>

          {/* DOCUMENT VAULT */}
          <DetailModule title="Document Vault" icon="folder" color="#7c3aed">
            <View style={styles.docGrid}>
              <DocEntry
                name="Curriculum Vitae"
                icon="document-attach"
                exists={!!candidate.cv_filepath}
                onPress={() => openDocument(candidate.cv_filepath)}
              />
              <DocEntry
                name="ID Verification"
                icon="id-card"
                exists={!!candidate.id_document_filepath}
                onPress={() => openDocument(candidate.id_document_filepath)}
              />
            </View>
          </DetailModule>

          {/* TIMELINE */}
          <DetailModule title="Recruitment Journey" icon="time" color="#64748b">
            <InfoRow label="Entry Date" value={candidate.created_at?.substring(0, 10)} />
            <InfoRow label="Last Pulse" value={candidate.updated_at?.substring(0, 10)} />
          </DetailModule>

          {manage && (
            <TouchableOpacity style={styles.purgeButton} onPress={handleDelete}>
              <Ionicons name="trash-bin" size={20} color="white" />
              <Text style={styles.purgeButtonText}>Purge Candidate Lead</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* --- REUSABLE MODULES --- */

function DetailModule({ title, icon, color, children }) {
  return (
    <View style={styles.moduleCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  );
}

function InfoRow({ label, value, isCopyable }) {
  return (
    <View style={styles.infoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Pending..."}</Text>
      </View>
      {isCopyable && (
        <TouchableOpacity style={styles.copyBtn}>
          <Ionicons name="copy-outline" size={16} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DocEntry({ name, icon, exists, onPress }) {
  if (!exists) return null;
  return (
    <TouchableOpacity style={styles.docItem} onPress={onPress}>
      <View style={styles.docIconBox}>
        <Ionicons name={icon} size={24} color="#2563eb" />
      </View>
      <Text style={styles.docName} numberOfLines={1}>{name}</Text>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

/* --- STYLES --- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerSafeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  screen: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#0f172a',
    fontWeight: '700',
  },

  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563eb',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroPosition: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  status_hired: { backgroundColor: "#10b981" },
  status_interview: { backgroundColor: "#3b82f6" },
  status_offer: { backgroundColor: "#f59e0b" },
  status_rejected: { backgroundColor: "#f87171" },
  status_default: { backgroundColor: "#64748b" },

  modulesContainer: {
    paddingHorizontal: 20,
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardBody: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '700',
  },
  longText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  docGrid: {
    gap: 12,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  purgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f87171',
    padding: 18,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 40,
    gap: 10,
  },
  purgeButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
});
