import React from 'react';
import { HangerIcon, BellIcon } from '../common/Icons';

export default function PetDisplay({ 
  virtualAvatar, 
  onCartillaClick, 
  onClothesClick, 
  onRemindersClick, 
  remindersCount 
}) {
  return (
    <div className="relative z-20 group mb-12">
      {/* Contenedor de la +cota pq todavía no tenemos diseños ni nada de eso */}
      <button 
        onClick={onCartillaClick} 
        className="relative w-64 h-64 md:w-72 md:h-72 cursor-pointer transition-all duration-700 hover:scale-105 block focus:outline-none"
      >
        <div className="absolute inset-[-40px] rounded-full bg-[#5fc4b8]/15 blur-[60px] animate-pulse pointer-events-none"></div>
        <div className="w-full h-full rounded-full bg-white/50 backdrop-blur-md shadow-[0_30px_60px_-15px_rgba(45,155,150,0.25)] border-[5px] border-white/90 flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_40px_80px_-15px_rgba(45,155,150,0.35)]">
          <div className="absolute inset-6 rounded-full border-2 border-dashed border-[#3aaba5]/20 animate-spin-slow pointer-events-none"></div>
          <div className="text-[8rem] md:text-[9rem] drop-shadow-2xl animate-bounce-gentle">
            {virtualAvatar}
          </div>
          {/* Overlay de interacción */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2d9b96]/40 via-[#2d9b96]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white text-[#2d9b96] px-6 py-3 rounded-full shadow-2xl font-black text-[11px] tracking-[0.25em] transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 border-b-4 border-[#3aaba5]/20">
              VER CARTILLA
            </div>
          </div>
        </div>
      </button>

      {/* Botón del vestidor */}
      <div className="absolute -bottom-6 -left-20 md:-left-32 z-30">
        <button 
          onClick={onClothesClick} 
          className="w-16 h-16 rounded-full bg-[#3aaba5] flex items-center justify-center text-white shadow-xl hover:bg-[#2d9b96] hover:scale-110 transition-all duration-300 border-[3px] border-white"
          title="Vestidor"
        >
          <HangerIcon />
        </button>
      </div>

      {/* Botón de recordatorios */}
      <div className="absolute -bottom-6 -right-20 md:-right-32 z-30">
        <button 
          onClick={onRemindersClick} 
          className="w-16 h-16 rounded-full bg-[#3aaba5] flex items-center justify-center text-white shadow-xl hover:bg-[#2d9b96] hover:scale-110 transition-all duration-300 border-[3px] border-white relative"
          title="Recordatorios"
        >
          <BellIcon />
          {remindersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white animate-pulse">
              {remindersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
