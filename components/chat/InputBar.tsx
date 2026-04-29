import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InputBarProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
      setInputHeight(44);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.topRow}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, height: Math.min(120, Math.max(44, inputHeight)) }]}
          placeholder="Ask Molfi anything..."
          placeholderTextColor={theme.textMuted}
          multiline
          value={text}
          onChangeText={setText}
          onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: theme.primary }, (!text.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.accessoryRow}>
        <TouchableOpacity style={styles.accessoryBtn} disabled>
          <Ionicons name="add" size={18} color={theme.textMuted} />
          <View style={{ width: 4 }} />
          <Text style={[styles.accessoryText, { color: theme.textMuted }]}>Attach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accessoryBtn} disabled>
          <Ionicons name="mic" size={18} color={theme.textMuted} />
          <View style={{ width: 4 }} />
          <Text style={[styles.accessoryText, { color: theme.textMuted }]}>Voice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    color: Colors.text,
    fontFamily: 'Syne-Medium',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  accessoryRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  accessoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.4,
  },
  accessoryText: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 12,
  },
});
