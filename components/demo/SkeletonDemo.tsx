import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function SkeletonDemo() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.headerText}>
            <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        
        <Skeleton width="100%" height={150} style={{ marginVertical: 16 }} />
        
        <View style={styles.footer}>
          <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="80%" height={12} />
        </View>
      </View>
      
      <View style={{ marginTop: 24 }}>
        <Skeleton width={200} height={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  footer: {
    marginTop: 8,
  }
});
