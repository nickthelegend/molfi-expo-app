import { usePreferences as usePrefsContext } from '@/context/PreferencesContext';

export function usePreferences() {
  return usePrefsContext();
}
