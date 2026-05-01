import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertDialog, useAlertDialog } from '@/components/ui/AlertDialog';
import { ThemeButton } from '@/components/ui/ThemeButton';

export function AlertDialogDemo() {
  const dialog = useAlertDialog();

  return (
    <View style={styles.container}>
      <ThemeButton title="Show Dialog" onPress={dialog.open} />
      
      <AlertDialog
        isVisible={dialog.isVisible}
        onClose={dialog.close}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={() => {
          console.log('Account deleted');
          dialog.close();
        }}
        onCancel={dialog.close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

