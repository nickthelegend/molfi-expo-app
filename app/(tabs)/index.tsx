import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { callGemini, getSystemPrompt, parseIntent, Message as GeminiMessage } from '@/hooks/useGeminiChat';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { usePreferences } from '@/hooks/usePreferences';
import { API_URL } from '@/constants/Config';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: any | null;
  intentPayload: any | null;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
};

export default function ChatScreen() {
  const { address } = useAppKitAccount();
  const { preferences, updatePreferences } = usePreferences();
  const { sessionId: paramSessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(paramSessionId || null);
  const [inputText, setInputText] = useState('');

  const isInitialState = messages.length === 0 && !isLoading;

  useEffect(() => {
    if (paramSessionId) {
      loadSession(paramSessionId);
    } else if (address && !sessionId) {
      createNewSession();
    }
  }, [paramSessionId, address]);

  const createNewSession = async () => {
    if (!address) return;
    try {
      const response = await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, title: "New Chat" })
      });
      const data = await response.json();
      if (data.success) {
        setSessionId(data.data._id);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/chat/sessions/${id}/messages`);
      const data = await response.json();
      if (data.success) {
        const loadedMessages = data.data.map((m: any) => ({
          id: m._id,
          role: m.role,
          content: m.content,
          intent: m.intent,
          intentPayload: m.intentPayload,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(loadedMessages.reverse());
        setSessionId(id);
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const handleSend = async (text: string) => {
    const messageToSend = text || inputText;
    if (!messageToSend.trim() || !address || !sessionId || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      intent: null,
      intentPayload: null,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [userMessage, ...prev]);
    setInputText('');
    setIsLoading(true);

    try {
      await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          role: 'user',
          content: messageToSend
        })
      });

      if (messages.length === 0) {
        await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: messageToSend.slice(0, 50) })
        });
      }

      const geminiMessages: GeminiMessage[] = messages
        .slice()
        .reverse()
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
      geminiMessages.push({ role: 'user', parts: [{ text: messageToSend }] });

      const systemPrompt = getSystemPrompt(address, preferences);
      const rawResponse = await callGemini(geminiMessages, systemPrompt);
      const { text: cleanText, intent } = parseIntent(rawResponse);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        intent: intent,
        intentPayload: intent?.payload || null,
        timestamp: new Date(),
        status: 'sent'
      };

      await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          role: 'assistant',
          content: cleanText,
          intent: intent,
          intentPayload: intent?.payload || null
        })
      });

      setMessages(prev => [assistantMessage, ...prev]);

      if (intent?.type === 'PREFERENCE_UPDATE') {
        updatePreferences(intent.payload);
      }

    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    router.setParams({ sessionId: undefined });
    createNewSession();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image 
              source={require('@/assets/logo/logo.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={[styles.logoText, { color: theme.text }]}>Molfi AI</Text>
          </View>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={startNewChat} style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <Ionicons name="create-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/chat-history')} style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <Ionicons name="time-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <Ionicons name="hardware-chip-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {isInitialState ? (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Main Greeting */}
              <View style={styles.greetingContainer}>
                <Text style={[styles.greetingTitle, { color: theme.text }]}>GM,</Text>
                <Text style={[styles.greetingSubtitle, { color: theme.textMuted }]}>How are we pumping that bag today?</Text>
              </View>

              {/* Suggestion Cards */}
              <View style={styles.cardGrid}>
                <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => handleSend("What are the hottest tokens right now?")}>
                  <View style={styles.cardIconHeader}>
                    <Ionicons name="flame-outline" size={18} color={theme.text} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Hot tokens</Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: theme.textMuted }]}>Trending and most hyped assets right now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => handleSend("Show my performance")}>
                  <View style={styles.cardIconHeader}>
                    <Ionicons name="stats-chart-outline" size={18} color={theme.text} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>My Performance</Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: theme.textMuted }]}>Track your growth and portfolio over a week</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageBubble 
                  role={item.role} 
                  content={item.content} 
                  intent={item.intent} 
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
              ListHeaderComponent={isLoading ? <TypingIndicator /> : null}
            />
          )}
        </View>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: 110 }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput 
              placeholder="Ask anything, / for quick prompts" 
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity style={[styles.plusButton, { backgroundColor: theme.card }]}>
                <Ionicons name="add" size={24} color={theme.textMuted} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.micButton, { backgroundColor: theme.primary }]}
                onPress={() => handleSend(inputText)}
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={inputText.trim() ? "arrow-up" : "mic"} size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  greetingContainer: {
    marginBottom: 60,
  },
  greetingTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 48,
  },
  greetingSubtitle: {
    fontFamily: 'Syne_400Regular',
    fontSize: 32,
    lineHeight: 40,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  cardIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
  },
  cardDesc: {
    fontFamily: 'Syne_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  inputWrapper: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontFamily: 'Syne_400Regular',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
