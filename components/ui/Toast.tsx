import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((title: string, description?: string) => 
    toast({ title, description, variant: 'success' }), [toast]);
    
  const error = useCallback((title: string, description?: string) => 
    toast({ title, description, variant: 'error' }), [toast]);
    
  const warning = useCallback((title: string, description?: string) => 
    toast({ title, description, variant: 'warning' }), [toast]);
    
  const info = useCallback((title: string, description?: string) => 
    toast({ title, description, variant: 'default' }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <SafeAreaView style={styles.container} pointerEvents="box-none">
        <View style={styles.toastStack}>
          {toasts.map((t) => (
            <Animated.View
              key={t.id}
              entering={FadeInUp.springify()}
              exiting={FadeOutUp.duration(200)}
              layout={Layout.springify()}
              style={[
                styles.toast,
                { backgroundColor: '#1d1d1d' },
                t.variant === 'error' && styles.errorToast,
                t.variant === 'success' && styles.successToast,
              ]}
            >
              <View style={styles.iconContainer}>
                {t.variant === 'error' ? (
                  <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                ) : t.variant === 'success' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                ) : t.variant === 'warning' ? (
                  <Ionicons name="warning" size={24} color="#FFCC00" />
                ) : (
                  <Ionicons name="notifications" size={24} color={theme.primary} />
                )}
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: '#fff' }]}>{t.title}</Text>
                {t.description && (
                  <Text style={styles.description}>{t.description}</Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#6C6C6C" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  toastStack: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  errorToast: {
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  successToast: {
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 15,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

