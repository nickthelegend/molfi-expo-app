import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BottomSheet, useBottomSheet } from '@/components/ui/BottomSheet';
import { ThemeButton } from '@/components/ui/ThemeButton';

export function BottomSheetDemo() {
  const { isVisible, open, close } = useBottomSheet();

  return (
    <View style={styles.container}>
      <ThemeButton title="Open Bottom Sheet" onPress={open} />
      
      <BottomSheet
        isVisible={isVisible}
        onClose={close}
        snapPoints={['30%', '60%', '90%']}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.title}>Welcome to Bottom Sheet</Text>
          <Text style={styles.description}>
            This is a basic bottom sheet that supports gesture interactions. You
            can drag it up and down to different snap points, or swipe down
            quickly to dismiss it.
          </Text>
          <ThemeButton title="Close" onPress={close} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    gap: 16,
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 22,
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Syne_400Regular',
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
    marginBottom: 20,
  },
});
