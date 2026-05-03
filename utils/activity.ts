import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActivityType = 'swap' | 'send' | 'bridge' | 'task' | 'stats';

export interface Activity {
  id: string;
  title: string;
  time: string;
  type: ActivityType;
  timestamp: number;
}

const STORAGE_KEY = 'molfi_recent_activity';

export const getActivities = async (): Promise<Activity[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load activities', e);
    return [];
  }
};

export const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'time'>) => {
  try {
    const existing = await getActivities();
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      time: 'Just now'
    };
    
    // Keep only last 20
    const updated = [newActivity, ...existing].slice(0, 20);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to add activity', e);
    return [];
  }
};

export const clearActivities = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear activities', e);
  }
};

// Helper to format relative time
export const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
