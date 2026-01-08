import { Alert, Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import apiService, { BASE_URL } from '../api/apiService';

/**
 * Universal Document Engine
 * Handles authenticated downloads and native preview/sharing for all document types.
 */
const documentEngine = {
    /**
     * downloadAndPreview
     * @param {string} type - 'employee', 'candidate_cv', or 'candidate_id'
     * @param {number|string} id - The document ID or resource ID
     * @param {string} filename - The suggested filename for the download
     */
    async downloadAndPreview(type, id, filename) {
        try {
            if (!id || !filename) {
                Alert.alert("Payload Error", "Reference identification or filename is missing.");
                return;
            }

            const token = await apiService.getToken();
            if (!token) {
                Alert.alert("Governance Protocol", "Secure session token missing. Please re-authenticate.");
                return;
            }

            let downloadUrl = '';
            if (type === 'employee') {
                downloadUrl = `${BASE_URL}/api/documents/employee/${id}/download`;
            } else if (type === 'candidate_cv') {
                downloadUrl = `${BASE_URL}/api/candidates/${id}/cv`;
            } else if (type === 'candidate_id') {
                downloadUrl = `${BASE_URL}/api/candidates/${id}/id-document`;
            } else {
                Alert.alert("System Error", "Unsupported document classification.");
                return;
            }

            // Sanitize filename to prevent path traversal or invalid characters
            const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const localPath = `${FileSystem.documentDirectory}${sanitizedFilename}`;

            Alert.alert("Retrieving Data", "Securely downloading from ALGHAITH cloud...");

            const res = await FileSystem.downloadAsync(downloadUrl, localPath, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status !== 200) {
                Alert.alert("Transfer Failure", `Server responded with status ${res.status}`);
                return;
            }

            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert("Access Granted", "File synchronized at internal storage: " + res.uri);
                return;
            }

            // Platform-specific handling for "Quick Preview" vs "Download"
            if (Platform.OS === 'android') {
                Alert.alert(
                    "Document Ready",
                    "Select an action:",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Share / Save",
                            onPress: () => Sharing.shareAsync(res.uri)
                        },
                        {
                            text: "Quick Preview",
                            onPress: async () => {
                                try {
                                    const contentUri = await FileSystem.getContentUriAsync(localPath);
                                    Linking.openURL(contentUri);
                                } catch (e) {
                                    Alert.alert("Preview Error", "No viewer found for this file type.");
                                    // Fallback to share
                                    Sharing.shareAsync(res.uri);
                                }
                            }
                        }
                    ],
                    { cancelable: true }
                );
            } else {
                // iOS: Sharing.shareAsync provides native QuickLook and Save options natively in the sheet
                await Sharing.shareAsync(res.uri);
            }

        } catch (e) {
            Alert.alert("Infrastructure Error", "Communication link failed: " + e.message);
        }
    }
};

export default documentEngine;
