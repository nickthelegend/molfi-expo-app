import { StyleSheet, View } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: theme.primary, dark: theme.primary }}
      headerImage={
        <View style={[styles.headerImageContainer, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.headerIcon}>🚀</ThemedText>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Molfi Intelligence</ThemedText>
      </ThemedView>
      <ThemedText style={styles.introText}>
        Explore the cutting-edge AI features that give you a competitive edge in the Solana ecosystem.
      </ThemedText>
      
      <Collapsible title="Research AI">
        <ThemedText>
          Our Research AI scans on-chain data, social sentiment (X/Twitter), and market trends in real-time.
        </ThemedText>
        <ThemedText>
          • Instant token analysis and safety scores.
          • Deep-dive into whales' movements.
          • Sentiment analysis of trending Solana coins.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Agentic Trading">
        <ThemedText>
          Deploy autonomous agents that work for you 24/7.
        </ThemedText>
        <ThemedText>
          • Set your risk parameters and let the agent execute.
          • Automated profit-taking and stop-loss management.
          • Real-time monitoring with push notifications.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Solana Optimized">
        <ThemedText>
          Built for speed. Molfi leverages Solana's high-throughput to ensure your trades are executed at the best possible prices.
        </ThemedText>
        <ThemedText>• Lightning-fast transaction confirmation.</ThemedText>
        <ThemedText>• Support for all major Solana DEXs via Jupiter aggregator.</ThemedText>
        <ThemedText>• Native Jito tip support for front-run protection.</ThemedText>
      </Collapsible>

      <Collapsible title="Security & Safety">
        <ThemedText>
          Your safety is our priority. Molfi includes built-in risk controls.
        </ThemedText>
        <ThemedText>
          • Rug-pull detection and honeypot checks.
          • Secure on-chain agentic wallet management.
          • Transparent audit logs of all agent actions.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Molfi Ecosystem">
        <ThemedText>
          Molfi is more than just a wallet; it's a complete ecosystem for the modern degen.
        </ThemedText>
        <ExternalLink href="https://molfi.io">
          <ThemedText type="link">Visit Molfi Website</ThemedText>
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 80,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  introText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 20,
    lineHeight: 24,
  },
});

