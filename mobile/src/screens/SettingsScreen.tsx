import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { mobileApi } from '../services/api';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:8000');

  const handleSave = () => {
    if (apiKey) mobileApi.setApiKey(apiKey);
    alert('Settings saved! Restart app to apply.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Settings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your API key"
          placeholderTextColor="#64748b"
          secureTextEntry
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://localhost:8000"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>💾 Save Settings</Text>
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.infoText}>📱 AI Agent Mobile v1.0.0</Text>
        <Text style={styles.infoText}>Built with React Native</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, fontSize: 15, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  info: { alignItems: 'center', marginTop: 40 },
  infoText: { fontSize: 12, color: '#475569', marginTop: 4 },
});
