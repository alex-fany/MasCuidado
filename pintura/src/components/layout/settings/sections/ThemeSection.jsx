import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../../../context/SettingsContext';
import SectionWrapper from '../SectionWrapper';

export default function ThemeSection() {
  const { theme, updateSetting, t } = useSettings();

  const themes = [
    { 
      id: 'light', 
      name: t('theme_light_name'),
      desc: t('theme_light_desc'),
      colors: ['#2d9b96', '#ffffff', '#e0f2f1'] 
    },
    { 
      id: 'dark', 
      name: t('theme_dark_name'),
      desc: t('theme_dark_desc'),
      colors: ['#4ebfba', '#0a1f1e', '#000000'] 
    },
    { 
      id: 'glass', 
      name: t('theme_glass_name'),
      desc: t('theme_glass_desc'),
      colors: ['#1a5d5a', '#f8fafc', '#cbd5e1'] 
    },
  ];

  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 gap-4 pb-8">
        {themes.map((tItem, index) => (
          <motion.button
            key={tItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => updateSetting('theme', tItem.id)}
            className={`group relative flex items-center gap-5 p-5 rounded-[2.5rem] border-2 transition-all duration-500 active:scale-[0.97] overflow-hidden ${
              theme === tItem.id 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 shadow-[0_20px_40px_-15px_rgba(45,155,150,0.2)]' 
                : 'border-[var(--brand-border)] bg-[var(--brand-surface)]/40 hover:border-[var(--brand-primary)]/40'
            }`}
          >
            {/* Fondo */}
            {theme === tItem.id && (
              <motion.div 
                layoutId="activeThemeBg"
                className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/5 to-transparent -z-10"
              />
            )}

            {/* Colores */}
            <div className="flex -space-x-3 shrink-0">
              {tItem.colors.map((color, i) => (
                <div 
                  key={i}
                  style={{ backgroundColor: color }}
                  className={`w-10 h-10 rounded-full border-4 border-[var(--brand-surface)] shadow-lg relative transition-transform group-hover:translate-x-1`}
                  style={{ backgroundColor: color, zIndex: 30 - i }}
                />
              ))}
            </div>

            <div className="flex flex-col items-start text-left flex-1 ml-2">
              <span className={`font-black text-lg tracking-tight leading-none ${theme === tItem.id ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-text)]'}`}>
                {tItem.name}
              </span>
              <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-widest opacity-60 ${theme === tItem.id ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-text)]'}`}>
                {tItem.desc}
              </span>
            </div>

            {/* Indicador de selección */}
            <div className={`w-8 h-8 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
              theme === tItem.id 
                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] scale-110 shadow-lg' 
                : 'border-[var(--brand-primary)]/20 scale-90 opacity-40'
            }`}>
              {theme === tItem.id && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </SectionWrapper>
  );
}
