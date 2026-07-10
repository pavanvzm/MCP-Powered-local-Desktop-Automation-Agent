import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { mobileApi } from '../services/api';

export default function DashboardScreen() {
  const [health, setHealth] = useState<{status: string; version: string} | null>(null);
  const [toolsCount, setToolsCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const h = await mobileApi.healthCheck();
      setHealth(h);
      const t = await mobileApi.listTools();
      setToolsCount(t.tools?.length || 0);
    } catch {
      setHealth({ status: 'offline', version: '---' });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Agent Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, health?.status === 'healthy' ? styles.online : styles.offline]} />
          <Text style={styles.statusText}>{health?.status === 'healthy' ? 'Online' : 'Offline'}</Text>
        </View>
        <Text style={styles.version}>v{health?.version || '1.0.0'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tools</Text>
        <Text style={styles.bigNumber}>{toolsCount || 7}</Text>
        <Text style={styles.label}>available tools</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <View style={styles.action}><Text style={styles.actionIcon}>🎤</Text><Text style={styles.actionLabel}>Voice</Text></View>
          <View style={styles.action}><Text style={styles.actionIcon}>🔧</Text><Text style={styles.actionLabel}>Tools</Text></View>
          <View style={styles.action}><Text style={styles.actionIcon}>🧠</Text><Text style={styles.actionLabel}>Memory</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 18, fontWeight: '600', color: '#f1f5f9' },
  version: { fontSize: 12, color: '#64748b' },
  bigNumber: { fontSize: 48, fontWeight: 'bold', color: '#6366f1' },
  label: { fontSize: 12, color: '#64748b' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  action: { alignItems: 'center', padding: 12 },
  actionIcon: { fontSize: 28, marginBottom: 4 },
  actionLabel: { fontSize: 12, color: '#94a3b8' },
});
