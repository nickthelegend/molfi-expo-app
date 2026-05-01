import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { useToast } from '@/components/ui/Toast';

export function ToastVariants() {
  const { success, error, warning, info } = useToast();

  return (
    <View style={styles.container}>
      <ThemeButton
        title="Success"
        onPress={() => success('Success!', 'Your action was completed successfully.')}
        style={styles.button}
      />
      <ThemeButton
        title="Error"
        onPress={() => error('Error!', 'Something went wrong. Please try again.')}
        style={[styles.button, { backgroundColor: '#FF3B30' }]}
      />
      <ThemeButton
        title="Warning"
        onPress={() => warning('Warning!', 'Please review your input before continuing.')}
        style={[styles.button, { backgroundColor: '#FFCC00' }]}
      />
      <ThemeButton
        title="Info"
        onPress={() => info('Info', "Here's some helpful information for you.")}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});

