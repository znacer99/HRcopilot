import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiService, { BASE_URL } from "../api/apiService";
import documentEngine from "../utils/documentEngine";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

/**
 * Candidate Detail Screen - HR 2026 High-Fidelity Redesign
 */
export default function CandidateDetailScreen({ route, navigation, user }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { manage = false } = route.params || {};
  const [candidate, setCandidate] = useState(route.params?.candidate);
  const isPrivileged = manage || ['it_manager', 'general_director', 'manager'].includes(user?.role?.toLowerCase());
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (route.params?.candidate) {
      setCandidate(route.params.candidate);
    }
  }, [route.params?.candidate]);

  if (!candidate) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>Lead record synchronization failed.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Return to Pipeline</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stages = ['new', 'shortlisted', 'interview', 'hired', 'rejected'];
  const currentStageIndex = stages.indexOf(candidate.status?.toLowerCase() || 'new');

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await apiService.updateCandidate(candidate.id, { status: newStatus });
      if (res.success) {
        setCandidate({ ...candidate, status: newStatus });
        Alert.alert("Pipeline Updated", `Lead has been transitioned to ${newStatus.toUpperCase()}.`);
      }
    } catch (err) {
      Alert.alert("Sync Error", "Failed to update pipeline stage.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePromote = async () => {
    setUpdating(true);
    try {
      const res = await apiService.promoteCandidate(candidate.id);
      if (res.success) {
        Alert.alert(
          "Talent Promoted",
          "This lead has been successfully transitioned to the Employee Registry.",
          [{ text: "View Registry", onPress: () => navigation.navigate('Staff') }]
        );
        setCandidate({ ...candidate, status: 'hired' });
      } else {
        Alert.alert("Promotion Failure", res.message);
      }
    } catch (err) {
      Alert.alert("System Error", "Failed to transition lead to registry.");
    } finally {
      setUpdating(false);
    }
  };

  const openDocument = async (type) => {
    const filename = type === 'cv' ? 'candidate_cv.pdf' : 'id_document.pdf';
    const docType = type === 'cv' ? 'candidate_cv' : 'candidate_id';
    await documentEngine.downloadAndPreview(docType, candidate.id, filename);
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
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.topNav, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>ALGHAITH Talent</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* HERO HEADER */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{candidate.full_name}</Text>
          <Text style={styles.heroPosition}>{candidate.applied_position || 'Open Role'}</Text>
          <Text style={styles.heroSpecialty}>{candidate.specialty || 'Generalist'}</Text>

          <View style={styles.statusRow}>
            <StatusBadge status={candidate.status || 'new'} />
          </View>
        </View>

        {/* PIPELINE PROGRESSION */}
        <View style={styles.pipelineCard}>
          <Text style={styles.sectionHeader}>ALGHAITH Acquisition Pipeline</Text>
          <View style={styles.pipelineBar}>
            {stages.slice(0, 4).map((s, i) => (
              <View key={s} style={styles.stageItem}>
                <View style={[
                  styles.stageDot,
                  i <= currentStageIndex && { backgroundColor: i === currentStageIndex ? colors.accent : colors.success }
                ]}>
                  {i < currentStageIndex && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text style={[styles.stageLabel, i <= currentStageIndex && { color: colors.text, fontWeight: '700' }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
                {i < 3 && <View style={[styles.stageLine, i < currentStageIndex && { backgroundColor: colors.success }]} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contentWrap}>
          {/* ACTION CONTROLS */}
          {manage && (
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('shortlisted')}>
                <Ionicons name="star" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Shortlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('interview')}>
                <Ionicons name="calendar" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('hired')}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.actionBtnText}>Hire</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('rejected')}>
                <Ionicons name="close-circle" size={18} color={colors.error} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>

              {['offer', 'interview', 'new'].includes(candidate.status?.toLowerCase()) && (
                <TouchableOpacity
                  style={[styles.actionBtn, { borderStyle: 'dashed', borderColor: colors.success }]}
                  onPress={handlePromote}
                >
                  <Ionicons name="rocket-outline" size={18} color={colors.success} />
                  <Text style={[styles.actionBtnText, { color: colors.success }]}>Promote</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* IDENTITY & CONTACT */}
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Ionicons name="person-outline" size={18} color={colors.accent} />
              <Text style={styles.cardTitle}>Personnel Dossier</Text>
            </View>
            <View style={styles.cardBody}>
              <InfoRow label="Email Address" value={candidate.email} colors={colors} />
              <InfoRow label="Direct Contact" value={candidate.phone || 'Not Provided'} colors={colors} />
              <InfoRow label="Nationality" value={candidate.nationality || '—'} colors={colors} />
              <InfoRow label="Education" value={candidate.education || '—'} colors={colors} />
            </View>
          </View>

          {/* INTERVIEW PROTOCOL LOGS */}
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Interview Protocol Logs</Text>
            </View>
            <View style={styles.timeline}>
              <TimelineItem
                colors={colors}
                date="2 Hours Ago"
                title="Screening Completed"
                desc="Initial verification of technical credentials looks promising."
              />
              <TimelineItem
                colors={colors}
                date="Yesterday"
                title="Lead Acquired"
                desc="Digital application received through portal."
                isLast
              />
            </View>
          </View>

          {/* CV / PORTFOLIO */}
          {candidate.cv_filepath && (
            <TouchableOpacity
              style={[styles.cvCard, { backgroundColor: colors.accent }]}
              onPress={() => openDocument('cv')}
            >
              <Ionicons name="document-attach" size={24} color="white" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.cvTitle}>Review Portfolio</Text>
                <Text style={styles.cvSubtitle}>Credential verification required</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="white" />
            </TouchableOpacity>
          )}

          {manage && (
            <View style={styles.managementSection}>
              <Button
                variant="outline"
                title="Modify Detailed Record"
                icon="create-outline"
                onPress={() => navigation.navigate("CandidateEdit", { candidate })}
              />
              <TouchableOpacity style={styles.purgeBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={styles.purgeText}>Purge Candidate Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {updating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </View>
  );
}

const InfoRow = ({ label, value, colors }) => {
  const styles = getStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const TimelineItem = ({ colors, date, title, desc, isLast }) => {
  const styles = getStyles(colors);
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineRight}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>{title}</Text>
          <Text style={styles.timelineDate}>{date}</Text>
        </View>
        <Text style={styles.timelineDesc}>{desc}</Text>
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  heroPosition: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '700',
  },
  heroSpecialty: {
    fontSize: 13,
    color: colors.accent,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusRow: {
    marginTop: 16,
  },
  pipelineCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    padding: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...Shadow.subtle,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  pipelineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stageItem: {
    alignItems: 'center',
    width: (width - 80) / 4,
    position: 'relative',
  },
  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stageLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  stageLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  contentWrap: {
    paddingHorizontal: Spacing.lg,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    ...Shadow.subtle,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    gap: 16,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  timeline: {
    paddingTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 30,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  timelineDate: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timelineDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: Radius.xl,
    marginBottom: 30,
    ...Shadow.medium,
  },
  cvTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
  },
  cvSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  managementSection: {
    gap: 16,
    marginBottom: 40,
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    backgroundColor: `${colors.error}05`,
    gap: 10,
  },
  purgeText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    color: 'white',
    fontWeight: '800',
  },
});
