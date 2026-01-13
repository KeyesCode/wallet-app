import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWallet } from "../context/WalletContext";
import {
  setCustomRpcUrl,
  loadCustomRpcUrls,
  getCustomRpcUrl,
} from "../services/walletMetadata";
import { EVM_NETWORKS, getAvailableChainIds } from "../crypto/networks";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { activeChainId, refreshCustomRpcUrl } = useWallet();
  const [customRpcUrls, setCustomRpcUrls] = useState<Record<number, string>>({});
  const [editingChainId, setEditingChainId] = useState<number | null>(null);
  const [editRpcUrl, setEditRpcUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomRpcUrls().then((urls) => {
      setCustomRpcUrls(urls);
      setLoading(false);
    });
  }, []);

  const handleEdit = (chainId: number) => {
    const network = EVM_NETWORKS[chainId];
    const currentCustom = customRpcUrls[chainId];
    setEditRpcUrl(currentCustom || network?.rpcUrl || "");
    setEditingChainId(chainId);
  };

  const handleSave = async () => {
    if (!editingChainId) return;

    const url = editRpcUrl.trim();
    
    // Basic URL validation
    if (url && !url.match(/^https?:\/\/.+/)) {
      Alert.alert("Invalid URL", "Please enter a valid HTTP/HTTPS URL");
      return;
    }

    try {
      setSaving(true);
      await setCustomRpcUrl(editingChainId, url || null);
      
      // Update local state
      const updated = { ...customRpcUrls };
      if (url) {
        updated[editingChainId] = url;
      } else {
        delete updated[editingChainId];
      }
      setCustomRpcUrls(updated);
      
      // Refresh WalletContext if this is the active chain
      if (editingChainId === activeChainId) {
        await refreshCustomRpcUrl();
      }
      
      setEditingChainId(null);
      setEditRpcUrl("");
      Alert.alert("Success", url ? "Custom RPC URL saved" : "Using backend default");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save RPC URL");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async (chainId: number) => {
    Alert.alert(
      "Clear Custom RPC",
      "This will remove the custom RPC URL and use the backend default. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await setCustomRpcUrl(chainId, null);
              
              const updated = { ...customRpcUrls };
              delete updated[chainId];
              setCustomRpcUrls(updated);
              
              // Refresh WalletContext if this is the active chain
              if (chainId === activeChainId) {
                await refreshCustomRpcUrl();
              }
              
              Alert.alert("Success", "Now using backend default");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to clear RPC URL");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const chainIds = getAvailableChainIds();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RPC Settings</Text>
      <Text style={styles.subtitle}>
        Configure custom RPC URLs for each network. Leave empty to use the backend default (Alchemy).
      </Text>

      {chainIds.map((chainId) => {
        const network = EVM_NETWORKS[chainId];
        if (!network) return null;

        const hasCustom = chainId in customRpcUrls;
        const currentUrl = customRpcUrls[chainId] || network.rpcUrl;
        const isActive = chainId === activeChainId;

        return (
          <View key={chainId} style={styles.networkCard}>
            <View style={styles.networkHeader}>
              <View style={styles.networkInfo}>
                <Text style={styles.networkName}>
                  {network.name} {isActive && "• Active"}
                </Text>
                <Text style={styles.networkDetails}>
                  Chain ID: {chainId} • {network.nativeSymbol}
                </Text>
              </View>
              {hasCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>

            <View style={styles.rpcInfo}>
              <Text style={styles.rpcLabel}>Current RPC:</Text>
              <Text style={styles.rpcUrl} numberOfLines={2}>
                {currentUrl}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                title={hasCustom ? "Edit" : "Set Custom"}
                onPress={() => handleEdit(chainId)}
                disabled={saving}
              />
              {hasCustom && (
                <Button
                  title="Clear"
                  color="#b00020"
                  onPress={() => handleClear(chainId)}
                  disabled={saving}
                />
              )}
            </View>
          </View>
        );
      })}

      {/* Edit Modal */}
      <Modal
        visible={editingChainId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setEditingChainId(null);
            setEditRpcUrl("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editingChainId && (
              <>
                <Text style={styles.modalTitle}>
                  {EVM_NETWORKS[editingChainId]?.name} RPC URL
                </Text>
                <Text style={styles.modalSubtitle}>
                  Leave empty to use backend default (Alchemy)
                </Text>

                <Text style={styles.inputLabel}>RPC URL</Text>
                <TextInput
                  style={styles.input}
                  value={editRpcUrl}
                  onChangeText={setEditRpcUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!saving}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      if (!saving) {
                        setEditingChainId(null);
                        setEditRpcUrl("");
                      }
                    }}
                    disabled={saving}
                  />
                  <Button
                    title={saving ? "Saving..." : "Save"}
                    onPress={handleSave}
                    disabled={saving}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  networkCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  networkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  networkDetails: {
    fontSize: 12,
    color: "#666",
  },
  customBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  customBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  rpcInfo: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  rpcLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  rpcUrl: {
    fontSize: 12,
    fontFamily: "Courier",
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "Courier",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
});

