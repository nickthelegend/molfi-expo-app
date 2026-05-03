import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from '@/constants/Config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Deep Linking Handler
export function useNotificationNavigation(router: any) {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.executionId) {
        router.push(`/executions/${data.executionId}`);
      } else if (data?.workflowId) {
        router.push('/(tabs)/workflows');
      }
    });

    return () => subscription.remove();
  }, [router]);
}

export async function registerForPushNotificationsAsync(walletAddress: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })).data;
    } catch (e) {
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (innerError) {
        console.error("Failed to get Expo Push Token", innerError);
      }
    }
    
    console.log('Push Token:', token);

    // Register token with our API
    if (walletAddress && token) {
      await fetch(`${API_URL}/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, pushToken: token })
      });
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}
