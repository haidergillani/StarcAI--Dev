import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  fontSize: 'medium'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      // Only access localStorage in browser environment
      const savedSettings = localStorage.getItem('userSettings');
      if (!savedSettings) return defaultSettings;
      try {
        const parsed = JSON.parse(savedSettings) as Settings;
        return {
          theme: parsed.theme || defaultSettings.theme,
          fontSize: parsed.fontSize || defaultSettings.fontSize
        };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only access localStorage in browser environment
      localStorage.setItem('userSettings', JSON.stringify(settings));

      // Apply theme
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');

      // Apply font size
      document.documentElement.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[settings.fontSize];
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 