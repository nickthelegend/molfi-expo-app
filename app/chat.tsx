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

      const response = await fetch(`${API_URL}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend, walletAddress: address })
      });
      const json = await response.json();
      
      if (!json.success) throw new Error(json.error);

      const aiData = json.data;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData.content,
        intent: aiData.intent,
        intentPayload: aiData.intentPayload,
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
            content: aiData.content,
            intent: aiData.intent,
            intentPayload: aiData.intentPayload
          })
        });
      }

      setMessages(prev => [assistantMessage, ...prev]);

      if (aiData.intent === 'PREFERENCE_UPDATE') {
        updatePreferences(aiData.intentPayload);
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
            <Text style={[styles.logoText, { color: theme.text }]}>Molfi AI</Text>
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
                  <Text style={[styles.chainName, { color: isSelected ? '#000' : theme.text }]}>{chain.name}</Text>
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
                <Text style={[styles.greetingSubtitle, { color: theme.textMuted }]}>Ready to deploy the swarm?</Text>
              </View>

              {/* Suggestion Grid */}
              <View style={styles.templateGrid}>
                <SuggestionCard 
                  title="Swap" 
                  desc="0.01 ETH to USDC" 
                  icon="swap-horizontal"
                  onPress={() => handleSend("Swap 0.01 ETH to USDC on Base")} 
                />
                <SuggestionCard 
                  title="Send" 
                  desc="10 USDC to ahmed.eth" 
                  icon="send-outline"
                  onPress={() => handleSend("Send 10 USDC to ahmed.eth")} 
                />
                <SuggestionCard 
                  title="Markets" 
                  desc="Fetch trending markets" 
                  icon="trending-up"
                  onPress={() => handleSend("fetch polymarket new markets")} 
                />
                <SuggestionCard 
                  title="KeeperHub" 
                  desc="Supply 1 ETH to Aave" 
                  icon="flash"
                  onPress={() => handleSend("Supply 1 ETH to Aave")} 
                />
              </View>

              <View style={[styles.capabilityCard, { backgroundColor: theme.card }]}>
                <Text style={styles.capabilityTag}>AGENT CAPABILITIES</Text>
                <CapabilityRow icon="search" label="Autonomous Research" desc="Crawl web for market alpha" />
                <CapabilityRow icon="layers" label="Multi-Protocol DeFi" desc="Aave, Uniswap, Safe, Compound" />
                <CapabilityRow icon="people" label="Swarm Intelligence" desc="Multi-agent consensus analysis" />
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

function SuggestionCard({ title, desc, icon, onPress }: { title: string, desc: string, icon: any, onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  return (
    <TouchableOpacity style={[styles.templateCard, { backgroundColor: theme.card }]} onPress={onPress}>
      <View style={styles.templateIconContainer}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View>
        <Text style={[styles.templateTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.templateDesc, { color: theme.textMuted }]} numberOfLines={1}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CapabilityRow({ icon, label, desc }: { icon: any, label: string, desc: string }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.capabilityRow}>
      <View style={[styles.capabilityIcon, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
        <Ionicons name={icon} size={14} color={theme.primary} />
      </View>
      <View>
        <Text style={[styles.capabilityLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.capabilityDesc, { color: theme.textMuted }]}>{desc}</Text>
      </View>
    </View>
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
    fontFamily: 'Manrope-ExtraBold',
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
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
  },
  greetingContainer: {
    marginBottom: 60,
  },
  greetingTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 48,
  },
  greetingSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 32,
    lineHeight: 40,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  templateCard: {
    width: (width - 50) / 2,
    borderRadius: 24,
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  templateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 14,
    marginBottom: 2,
  },
  templateDesc: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  capabilityCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 100,
  },
  capabilityTag: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  capabilityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capabilityLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    marginBottom: 2,
  },
  capabilityDesc: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
  },
});

