import React from 'react';
import { BellIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';
import NutricionHub from './NutricionHub';

export default function PetDisplay({ activePet, onCartillaClick, onRemindersClick, onNutricionClick, onWaterClick, nutricionRefreshKey, remindersCount }) {
  const { t } = useSettings();
  const imageUrl = activePet?.imagen 
    ? (activePet.imagen.startsWith('http') ? activePet.imagen : `/uploads/${activePet.imagen}`) 
    : null;

  const sideButtonStyle = "w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2 sm:border-4 border-[var(--brand-border-strong)] shadow-lg relative group overflow-visible bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] hover:shadow-xl hover:ring-4 hover:ring-[var(--brand-accent)]/30 active:translate-y-0.5 text-[var(--brand-button-text)]";

  return (
    <div className="relative w-full flex items-center justify-center gap-2 xs:gap-3 sm:gap-6 md:gap-8 py-3 sm:py-6 md:py-10 overflow-visible">
      
      {/* Botón izquierdo: Nutrición */}
      <div className="shrink-0 z-20 scale-85 xs:scale-90 sm:scale-100 origin-center">
        <NutricionHub activePet={activePet} onClick={onNutricionClick} onWaterClick={onWaterClick} refreshKey={nutricionRefreshKey} />
      </div>

      {/* Visualización de la Mascota */}
      <div 
        className="relative group cursor-pointer shrink-0"
        onClick={onCartillaClick}
      >
        <div className="absolute inset-0 bg-[var(--brand-primary)]/20 rounded-full blur-2xl sm:blur-3xl group-hover:bg-[var(--brand-primary)]/30 transition-colors duration-700 scale-125 sm:scale-150 animate-pulse"></div>
        
        <div className="relative w-44 h-44 xs:w-52 xs:h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-[var(--brand-surface-glass)] backdrop-blur-sm rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4rem] border-4 sm:border-8 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-700 group-hover:rotate-1">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={activePet?.nombre} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-7xl xs:text-8xl sm:text-9xl animate-float-gentle drop-shadow-2xl">
                {activePet?.realAvatar || '🐾'}
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-[var(--brand-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="bg-[var(--brand-modal-bg)] px-3 xs:px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full shadow-lg font-black text-[var(--brand-primary)] text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-widest border border-white/20 sm:border-2 sm:border-[var(--brand-border)]">
               {t('home_view_records')}
             </div>
          </div>
        </div>
      </div>

      {/* Botón derecho: Recordatorios */}
      <div className="shrink-0 z-20 scale-85 xs:scale-90 sm:scale-100 origin-center">
        <button onClick={onRemindersClick} className={sideButtonStyle} title={t('cal_events')}>
          <div className="group-hover:-rotate-6 transition-transform relative z-10 scale-90 sm:scale-100">
            <BellIcon />
          </div>
          
          {/* Badge de notificación */}
          {remindersCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center z-[50]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-40"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 sm:h-6 sm:w-6 bg-[var(--brand-primary)] border sm:border-2 border-[var(--brand-border-strong)] text-[var(--brand-button-text)] text-[8px] sm:text-[10px] font-black items-center justify-center shadow-lg">
                {remindersCount}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
