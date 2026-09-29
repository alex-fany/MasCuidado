import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, CheckIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';

export default function DashboardHeader({ onConfigClick, onAddMascotaClick, onEditPetClick, activePet, pets, setActivePetId, user }) {
  const { t, language } = useSettings();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userData = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userName = userData.nombreCompleto || userData.nombre_completo || userData.nombre || "Usuario";

  return (
    <header className="w-full px-3 xs:px-4 py-2.5 xs:py-3 sm:py-4 flex justify-between items-center relative z-[100] shrink-0 text-left">
      <div className="flex items-center gap-2 xs:gap-3 min-w-0">
        <button 
          onClick={onConfigClick}
          className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg active:scale-95 group shrink-0"
        >
          <div className="animate-spin-slow scale-90 sm:scale-100">
            <SettingsIcon />
          </div>
        </button>
        <div className="flex flex-col items-start leading-tight min-w-0">
          <span className="text-[var(--brand-accent)] text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80 italic">{t('header_welcome')}</span>
          <span className="text-white text-base xs:text-lg sm:text-xl font-black tracking-tighter italic drop-shadow-md truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[160px]">
            {userName}
          </span>
        </div>
      </div>

      <div className="relative shrink-0" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`h-10 xs:h-11 sm:h-12 px-2.5 xs:px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center gap-2 sm:gap-3 hover:bg-white/20 transition-all shadow-lg active:scale-95 group relative ${pets.length === 0 ? 'ripple-effect' : ''}`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[var(--brand-primary)] flex items-center justify-center text-base sm:text-lg shadow-inner group-hover:scale-110 transition-transform shrink-0">
            {activePet?.realAvatar || '🐾'}
          </div>
          <span className="text-white font-black text-xs xs:text-sm tracking-tight italic truncate max-w-[65px] xs:max-w-[90px] sm:max-w-none">
            {activePet?.nombre || (language === 'en' ? 'Select' : language === 'pt' ? 'Selecionar' : 'Seleccionar')}
          </span>
          <div className={`text-white/40 text-xs sm:text-sm transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-64 xs:w-72 bg-[var(--brand-modal-bg)] backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-2 sm:border-4 border-[var(--brand-border-strong)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200">
            <div className="max-h-[340px] overflow-y-auto custom-scrollbar flex flex-col pt-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]/40 ml-5 mb-3">{t('profile_pack')}</p>
              
              <div className="flex flex-col">
                {pets.map((pet, idx) => (
                  <div 
                    key={pet.id} 
                    onClick={() => { setActivePetId(pet.id); setIsDropdownOpen(false); }}
                    className={`flex items-center gap-4 px-5 py-3 transition-all duration-200 cursor-pointer group relative
                      ${idx !== pets.length - 1 ? 'border-b border-[var(--brand-primary)]/5' : ''}
                      ${activePet?.id === pet.id ? 'bg-[var(--brand-primary)]/[0.03]' : 'hover:bg-[var(--brand-primary)]/[0.05]'}`}
                  >
                    {/* Indicador lateral activo */}
                    {activePet?.id === pet.id && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--brand-primary)] rounded-r-full animate-in slide-in-from-left-1"></div>
                    )}

                    <div className={`w-10 h-10 flex items-center justify-center text-2xl transition-transform duration-500 ${activePet?.id === pet.id ? 'scale-110' : 'opacity-70 group-hover:scale-110'}`}>
                      {pet.realAvatar}
                    </div>

                    <div className="flex flex-col text-left flex-1">
                      <span className={`font-black text-sm italic tracking-tight leading-none ${activePet?.id === pet.id ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-text)]'}`}>
                        {pet.nombre}
                      </span>
                      <span className="text-[8px] font-bold uppercase mt-1 text-[var(--brand-text)] opacity-30">
                        {t(`pet_${pet.tipo.toLowerCase()}`)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 pr-1">
                      {activePet?.id === pet.id && (
                        <div className="text-[var(--brand-primary)] scale-75">
                          <CheckIcon />
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditPetClick(pet); setIsDropdownOpen(false); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[var(--brand-text)]/30 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 active:scale-90"
                        title={t('header_manage')}
                      >
                        <span className="scale-75 italic font-black">✎</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--brand-primary)]/10">
              <button 
                onClick={() => { onAddMascotaClick(); setIsDropdownOpen(false); }}
                className="w-full py-2.5 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:opacity-90 transition-all shadow-md active:scale-95 border-b-4 border-black/10"
              >
                <span className="text-lg leading-none">+</span> {t('header_add_pet')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
