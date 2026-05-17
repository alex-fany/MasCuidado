import React, { useState } from 'react';
import { CloseIcon } from '../common/Icons';
import { AVATAR_OPTIONS, PREMIUM_COLORS } from '../../constants/avatars';
import { useSettings } from '../../context/SettingsContext';

export default function AvatarSelector({ currentAvatar, currentColor, onSelect, onClose }) {
  const { t } = useSettings();
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatar);
  const [selectedColor, setSelectedColor] = useState(currentColor || '#2d9b96');

  const handleConfirm = () => {
    onSelect(selectedAvatarId, selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[var(--brand-modal-bg)] rounded-[3rem] border-4 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh]">
        <header className="p-6 border-b border-[var(--brand-primary)]/10 bg-[var(--brand-surface-muted)] flex justify-between items-center shrink-0 text-left">
          <div>
            <h3 className="text-2xl font-black text-[var(--brand-primary)] italic leading-none">{t('avatar_title')}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{t('avatar_subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border border-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/10 transition-colors">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-10 text-left">
          {/* Sección de Colores */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-70 ml-2">{t('avatar_step1')}</h4>
            <div className="flex flex-wrap gap-4 justify-center">
              {PREMIUM_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-4 transition-all duration-300 hover:scale-125
                    ${selectedColor === color ? 'border-[var(--brand-text)] scale-110 shadow-lg' : 'border-white shadow-sm'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Sección de Avatares */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-70 ml-2">{t('avatar_step2')}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`w-full aspect-square rounded-[2rem] flex items-center justify-center p-3 transition-all duration-300 group
                    ${selectedAvatarId === avatar.id 
                      ? 'bg-[var(--brand-primary)]/10 border-4 border-[var(--brand-primary)] shadow-lg scale-105' 
                      : 'bg-[var(--brand-surface-muted)] border-2 border-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/40 hover:scale-110 shadow-sm'
                    }`}
                  dangerouslySetInnerHTML={{ __html: avatar.svg.replace(/{{COLOR}}/g, selectedColor) }}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-[var(--brand-primary)]/10 bg-[var(--brand-surface-muted)] flex gap-4">
           <button 
             onClick={handleConfirm}
             className="flex-1 py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-2xl shadow-lg hover:bg-[var(--brand-secondary)] transition-all uppercase tracking-widest text-xs active:scale-95"
           >
             {t('avatar_save')}
           </button>
           <button 
             onClick={onClose}
             className="px-8 py-4 bg-[var(--brand-surface-muted)] border-2 border-[var(--brand-border)] text-[var(--brand-text)] font-black rounded-2xl hover:opacity-80 transition-all uppercase tracking-widest text-xs active:scale-95"
           >
             {t('profile_back')}
           </button>
        </footer>
      </div>
    </div>
  );
}
