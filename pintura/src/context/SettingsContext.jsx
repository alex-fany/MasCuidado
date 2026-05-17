import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('masCuidado_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { theme: 'light', language: 'es', notifications: true };
  });

  // Efecto para guardar en localStorage cada vez que settings cambie
  useEffect(() => {
    localStorage.setItem('masCuidado_settings', JSON.stringify(settings));
    
    // Aplicar tema visual
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    if (settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const t = (key) => {
    const lang = settings.language || 'es';
    const dict = translations[lang] || translations['es'];
    return dict[key] || translations['es'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ 
      settings,
      updateSetting,
      theme: settings.theme,
      language: settings.language,
      t
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings error');
  return context;
}
