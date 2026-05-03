import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Intent } from '@/hooks/useGroqChat';
import { SwapCard } from './cards/SwapCard';
import { SendCard } from './cards/SendCard';
import { CreateAgentCard } from './cards/CreateAgentCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  intent: Intent | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, intent }) => {
  const isUser = role === 'user';
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {content ? (
        <View style={[
          styles.bubble, 
          isUser 
            ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 } 
            : { backgroundColor: theme.card, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[styles.text, { color: isUser ? '#FFF' : theme.text }]}>
            {content}
          </Text>
        </View>
      ) : null}

      {intent && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.cardWrapper}>
          {(intent.type === 'SWAP' || intent === 'swap') && <SwapCard payload={intent} />}
          {(intent.type === 'SEND' || intent === 'send') && <SendCard payload={intent} />}
          {(intent === 'keeperhub') && <KeeperHubCard payload={intent} />}
          {(intent === 'polymarket_fetch') && <PolymarketCard payload={intent} />}
          {intent.type === 'CREATE_AGENT' && <CreateAgentCard payload={intent} />}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: '90%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  text: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  cardWrapper: {
    marginTop: 10,
    width: '100%',
  }
});

