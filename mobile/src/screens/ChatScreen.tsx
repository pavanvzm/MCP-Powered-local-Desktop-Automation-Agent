import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { mobileApi } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    messages.length && flatListRef.current?.scrollToEnd();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await mobileApi.sendMessage(input.trim());
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.content || 'Hello from AI Agent!' };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '🤖 AI Agent ready! Configure API key for full capabilities.' };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.aiText]}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Agent</Text>
          <Text style={styles.headerSub}>Mobile Assistant</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤖</Text>
              <Text style={styles.emptyText}>Send a message to start</Text>
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
            <Text style={styles.sendButtonText}>{loading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  flex: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  messageList: { flex: 1 },
  messageContainer: { padding: 16, flexGrow: 1 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { backgroundColor: '#6366f1', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#334155' },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#ffffff' },
  aiText: { color: '#f1f5f9' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#64748b' },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, fontSize: 15, color: '#f1f5f9', maxHeight: 100, marginRight: 8 },
  sendButton: { backgroundColor: '#6366f1', borderRadius: 12, padding: 12, paddingHorizontal: 20 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
