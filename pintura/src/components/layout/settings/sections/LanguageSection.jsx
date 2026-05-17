import React from 'react';
import { useSettings } from '../../../../context/SettingsContext';
import SectionWrapper from '../SectionWrapper';

export default function LanguageSection() {
  const { language, updateSetting } = useSettings();

  const languages = [
    { id: 'es', label: 'Español', flag: '🇪🇸', region: 'Latinoamérica' },
    { id: 'en', label: 'English', flag: '🇺🇸', region: 'United States' },
    { id: 'pt', label: 'Português', flag: '🇧🇷', region: 'Brasil' },
  ];

  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 gap-3 pb-6">
        {languages.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              console.log("Cambiando a:", l.id);
              updateSetting('language', l.id);
            }}
            className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
              language === l.id 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' 
                : 'border-transparent bg-[var(--brand-surface-muted)] hover:bg-[var(--brand-surface)]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-surface)] flex items-center justify-center text-2xl shadow-sm border border-[var(--brand-border)]">
                {l.flag}
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-black text-lg ${language === l.id ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-text)]'}`}>
                  {l.label}
                </span>
                <span className="text-[10px] font-black text-[var(--brand-secondary)] uppercase tracking-widest opacity-60">
                  {l.region}
                </span>
              </div>
            </div>
            {language === l.id && (
              <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </SectionWrapper>
  );
}
