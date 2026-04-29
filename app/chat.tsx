import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { callGroq, getSystemPrompt, parseIntent, Message as GroqMessage } from '@/hooks/useGroqChat';
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
    } else if (address) {
      if (!sessionId) createNewSession();
    } else {
      setSessionId("guest-session");
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
      setSessionId("demo-session"); 
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
    console.log('[Chat] handleSend called with:', messageToSend);
    
    // Fallback if sessionId is not ready yet
    const activeSessionId = sessionId || 'guest-session';
    
    if (!messageToSend.trim() || isLoading) {
      console.warn('[Chat] Cannot send: empty text or loading');
      return;
    }

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
      if (address && activeSessionId !== 'demo-session' && activeSessionId !== 'guest-session') {
        console.log('[Chat] Saving message to DB for session:', activeSessionId);
        await fetch(`${API_URL}/chat/sessions/${activeSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            role: 'user',
            content: messageToSend
          })
        });

        if (messages.length === 0) {
          await fetch(`${API_URL}/chat/sessions/${activeSessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: messageToSend.slice(0, 50) })
          });
        }
      }

      const groqMessages: GroqMessage[] = messages
        .slice()
        .reverse()
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      groqMessages.push({ role: 'user', content: messageToSend });

      const systemPrompt = getSystemPrompt(address || '0x...', preferences);
      const rawResponse = await callGroq(groqMessages, systemPrompt);
      console.log('[Chat] Raw AI Response:', rawResponse);
      const { text: cleanText, intent } = parseIntent(rawResponse);
      console.log('[Chat] Parsed Intent:', JSON.stringify(intent, null, 2));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        intent: intent,
        intentPayload: intent?.payload || null,
        timestamp: new Date(),
        status: 'sent'
      };

      if (address && activeSessionId !== 'demo-session' && activeSessionId !== 'guest-session') {
        await fetch(`${API_URL}/chat/sessions/${activeSessionId}/messages`, {
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
      }

      setMessages(prev => [assistantMessage, ...prev]);

      if (intent?.type === 'PREFERENCE_UPDATE') {
        updatePreferences(intent.payload);
      }

    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: "Sorry, I encountered an error. Please check your connection or Groq API key.",
          intent: null,
          intentPayload: null,
          timestamp: new Date()
        },
        ...prev
      ]);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Text style={[styles.logoText, { color: theme.text }]}>Molfi Chat</Text>
          </View>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={startNewChat} style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <Ionicons name="create-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/chat-history')} style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <Ionicons name="time-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chain Selector */}
        <View style={styles.chainSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainScroll}>
            {[
              { id: 16661, name: '0G', logo: 'https://raw.githubusercontent.com/0glabs/0g-chain-registry/main/mainnets/0g/images/0g.png' },
              { id: 1, name: 'ETH', logo: 'https://icons.llama.fi/chains/rsz_ethereum.jpg' },
              { id: 8453, name: 'Base', logo: 'https://icons.llama.fi/chains/rsz_base.jpg' },
              { id: 42161, name: 'Arb', logo: 'https://icons.llama.fi/chains/rsz_arbitrum.jpg' },
              { id: 137, name: 'Poly', logo: 'https://icons.llama.fi/chains/rsz_polygon.jpg' },
              { id: 56, name: 'BNB', logo: 'https://icons.llama.fi/chains/rsz_bsc.jpg' },
              { id: 10, name: 'Op', logo: 'https://icons.llama.fi/chains/rsz_optimism.jpg' },
              { id: 43114, name: 'Avax', logo: 'https://icons.llama.fi/chains/rsz_avalanche.jpg' },
            ].map((chain) => {
              const isSelected = preferences.defaultChain === chain.id;
              return (
                <TouchableOpacity 
                  key={chain.id}
                  style={[
                    styles.chainChip, 
                    { backgroundColor: isSelected ? theme.primary : theme.card, borderColor: isSelected ? theme.primary : theme.border }
                  ]}
                  onPress={() => updatePreferences({ defaultChain: chain.id })}
                >
                  <Image source={{ uri: chain.logo }} style={styles.chainLogo} />
                  <Text style={[styles.chainName, { color: isSelected ? '#FFF' : theme.text }]}>{chain.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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

        {/* Shortcuts / Slash Commands */}
        {inputText.startsWith('/') && (
          <View style={[styles.shortcutsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { label: 'Hot Tokens', cmd: '/trending' },
                { label: 'My Portfolio', cmd: '/portfolio' },
                { label: 'Swap ETH', cmd: '/swap eth to usdc' },
                { label: 'Top Gainers', cmd: '/gainers' },
                { label: 'Agent Status', cmd: '/agents' },
              ].map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.shortcutChip, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    setInputText(item.cmd + ' ');
                  }}
                >
                  <Text style={[styles.shortcutText, { color: theme.text }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <TextInput 
              placeholder="Ask Molfi anything..." 
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={[styles.input, { color: '#FFF' }]}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="center"
              onSubmitEditing={() => handleSend(inputText)}
            />
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.sendButton, { backgroundColor: theme.primary }, (isLoading || !inputText.trim()) && { opacity: 0.5 }]}
              onPress={() => {
                console.log('[Chat] Send button pressed');
                handleSend(inputText);
              }}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={24} color="#000" />
              )}
            </TouchableOpacity>
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
    paddingTop: 10,
  },
  chainSelectorContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  chainScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  chainLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  chainName: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 13,
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
    borderRadius: 30,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  input: {
    flex: 1,
    fontFamily: 'Syne-Regular',
    fontSize: 16,
    paddingHorizontal: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 100,
  },
  shortcutChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  shortcutText: {
    fontFamily: 'Syne-Bold',
    fontSize: 13,
  },
});
