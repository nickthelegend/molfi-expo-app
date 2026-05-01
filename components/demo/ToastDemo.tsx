import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { useToast } from '@/components/ui/Toast';

export function ToastDemo() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: 'Toast Notification',
      description: 'This is a basic toast notification with title and description.',
      variant: 'default',
    });
  };

  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'Your trade has been executed successfully.',
      variant: 'success',
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'Error',
      description: 'Failed to connect to the network. Please try again.',
      variant: 'error',
    });
  };

  return (
    <View style={styles.container}>
      <ThemeButton title="Show Default Toast" onPress={showDefaultToast} style={styles.button} />
      <ThemeButton title="Show Success Toast" onPress={showSuccessToast} style={styles.button} />
      <ThemeButton title="Show Error Toast" onPress={showErrorToast} style={styles.button} />
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

