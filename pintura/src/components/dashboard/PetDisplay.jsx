import React from 'react';
import { BellIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';
import NutricionHub from './NutricionHub';

export default function PetDisplay({ activePet, onCartillaClick, onRemindersClick, onNutricionClick, onWaterClick, nutricionRefreshKey, remindersCount }) {
  const { t } = useSettings();
  const imageUrl = activePet?.imagen 
    ? `http://localhost:3000/uploads/${activePet.imagen}` 
    : null;

  const sideButtonStyle = "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-[var(--brand-border-strong)] shadow-lg relative group overflow-visible bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] hover:shadow-xl hover:ring-4 hover:ring-[var(--brand-accent)]/30 active:translate-y-0.5 text-[var(--brand-button-text)]";

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-10 overflow-visible">
      
      {/* Botón izquierdo */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <NutricionHub activePet={activePet} onClick={onNutricionClick} onWaterClick={onWaterClick} refreshKey={nutricionRefreshKey} />
      </div>

      {/* Botón derecho */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <button onClick={onRemindersClick} className={sideButtonStyle} title={t('cal_events')}>
          <div className="group-hover:-rotate-6 transition-transform relative z-10">
            <BellIcon />
          </div>
          
          {/* Badge de notificación */}
          {remindersCount > 0 && (
            <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center z-[50]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-40"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-[var(--brand-primary)] border-2 border-[var(--brand-border-strong)] text-[var(--brand-button-text)] text-[10px] font-black items-center justify-center shadow-lg">
                {remindersCount}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Visualización de la Mascota */}
      <div 
        className="relative group cursor-pointer"
        onClick={onCartillaClick}
      >
        <div className="absolute inset-0 bg-[var(--brand-primary)]/20 rounded-full blur-3xl group-hover:bg-[var(--brand-primary)]/30 transition-colors duration-700 scale-150 animate-pulse"></div>
        
        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-[var(--brand-surface-glass)] backdrop-blur-sm rounded-[4rem] border-8 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-700 group-hover:rotate-1">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={activePet?.nombre} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-9xl animate-float-gentle drop-shadow-2xl">
                {activePet?.realAvatar || '🐾'}
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-[var(--brand-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="bg-[var(--brand-modal-bg)] px-6 py-2.5 rounded-full shadow-lg font-black text-[var(--brand-primary)] text-xs uppercase tracking-widest border-2 border-[var(--brand-border)]">
               {t('home_view_records')}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
