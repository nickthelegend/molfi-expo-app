import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAccount } from 'wagmi';
import { keeperHub } from '@/utils/keeperhub';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/Config';

const TEMPLATES = [
  {
    id: 'balance-alert',
    name: 'Balance Alert',
    icon: 'notifications',
    description: 'Notify me when ETH balance drops below a threshold',
    nodes: [
      { id: 'trigger-1', type: 'trigger', data: { label: 'Every hour', config: { triggerType: 'Schedule', interval: 'hourly' } } },
      { id: 'check-balance', type: 'action', data: { label: 'Check Balance', config: { actionType: 'web3/check-balance', network: '1', address: '{{walletAddress}}' } } },
      { id: 'condition-1', type: 'condition', data: { label: 'Below 0.1 ETH', config: { operator: '<', value: '0.1', field: '{{@check-balance:Balance.value}}' } } },
      { id: 'notify-webhook', type: 'action', data: { label: 'Notify Molfi', config: { actionType: 'webhook/send', url: `${API_URL}/keeperhub/webhook`, method: 'POST', body: JSON.stringify({ walletAddress: '{{walletAddress}}', title: 'Low Balance Alert', message: 'Your ETH balance is below 0.1 ETH' }) } } }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'check-balance' },
      { id: 'e2', source: 'check-balance', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', target: 'notify-webhook', sourceHandle: 'true' }
    ]
  },
  {
    id: 'contract-monitor',
    name: 'Contract Monitor',
    icon: 'eye',
    description: 'Monitor smart contract total supply changes',
    nodes: [
      { id: 'trigger-1', type: 'trigger', data: { label: 'Every hour', config: { triggerType: 'Schedule', interval: 'hourly' } } },
      { id: 'read-contract', type: 'action', data: { label: 'Read Total Supply', config: { actionType: 'web3/read-contract', network: '1', contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', functionName: 'totalSupply' } } },
      { id: 'notify-webhook', type: 'action', data: { label: 'Notify Molfi', config: { actionType: 'webhook/send', url: `${API_URL}/keeperhub/webhook`, method: 'POST', body: JSON.stringify({ walletAddress: '{{walletAddress}}', title: 'Contract Update', message: 'USDT Total Supply: {{@read-contract:Result.value}}' }) } } }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'read-contract' },
      { id: 'e2', source: 'read-contract', target: 'notify-webhook' }
    ]
  },
  {
    id: 'uniswap-swap',
    name: 'Auto Swap',
    icon: 'swap-horizontal',
    description: 'Automatically swap tokens via Uniswap on trigger',
    nodes: [
      { id: 'trigger-1', type: 'trigger', data: { label: 'Manual Trigger', config: { triggerType: 'Manual' } } },
      { id: 'uniswap-action', type: 'action', data: { label: 'Uniswap Swap', config: { actionType: 'uniswap/swap', network: '1', fromToken: 'ETH', toToken: 'USDC', amount: '0.01' } } }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'uniswap-action' }
    ]
  },
  {
    id: 'aave-lend',
    name: 'Aave Deposit',
    icon: 'briefcase',
    description: 'Deposit funds into Aave V3 pools',
    nodes: [
      { id: 'trigger-1', type: 'trigger', data: { label: 'Manual Trigger', config: { triggerType: 'Manual' } } },
      { id: 'aave-action', type: 'action', data: { label: 'Aave Deposit', config: { actionType: 'aave-v3/deposit', network: '1', asset: 'USDC', amount: '100' } } }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aave-action' }
    ]
  }
];

export default function NewWorkflowScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address } = useAccount();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWorkflow = async () => {
    if (!name) return Alert.alert("Error", "Please enter a name");
    if (!selectedTemplate) return Alert.alert("Error", "Please select a template");

    setIsSubmitting(true);
    try {
      // Replace placeholders in nodes config
      const nodes = selectedTemplate.nodes.map((node: any) => {
        let configStr = JSON.stringify(node.data.config);
        configStr = configStr.replace(/{{walletAddress}}/g, address || '');
        
        return {
          id: node.id,
          type: node.type,
          data: {
            ...node.data,
            config: JSON.parse(configStr)
          }
        };
      });

      const res = await keeperHub.createWorkflow({
        name,
        description: description || selectedTemplate.description,
        nodes,
        edges: selectedTemplate.edges,
        enabled: true
      });

      if (res.data) {
        Alert.alert("Success", "Automation created successfully!");
        router.back();
      }
    } catch (error: any) {
      console.error("Create workflow error:", error);
      Alert.alert("Error", error.message || "Failed to create workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>New Automation</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workflow Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Name (e.g. ETH Balance Watch)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Template</Text>
          {TEMPLATES.map(template => (
            <TouchableOpacity 
              key={template.id}
              style={[
                styles.templateCard, 
                selectedTemplate?.id === template.id && { borderColor: theme.primary, backgroundColor: 'rgba(255,255,255,0.06)' }
              ]}
              onPress={() => {
                setSelectedTemplate(template);
                if (!name) setName(template.name);
              }}
            >
              <View style={[styles.templateIcon, { backgroundColor: selectedTemplate?.id === template.id ? theme.primary : 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name={template.icon as any} size={24} color="#fff" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDesc}>{template.description}</Text>
              </View>
              {selectedTemplate?.id === template.id && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: theme.primary }, (isSubmitting || !selectedTemplate || !name) && { opacity: 0.5 }]}
          onPress={createWorkflow}
          disabled={isSubmitting || !selectedTemplate || !name}
        >
          <Text style={styles.submitBtnText}>{isSubmitting ? 'Creating...' : 'Create Automation'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, color: '#fff' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, color: '#fff', fontFamily: 'Inter-Medium', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  textArea: { height: 100, textAlignVertical: 'top' },
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  templateIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  templateInfo: { flex: 1, marginLeft: 16 },
  templateName: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  templateDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  submitBtn: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  submitBtnText: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff' }
});
