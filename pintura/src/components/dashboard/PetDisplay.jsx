import React from 'react';
import { HangerIcon, BellIcon } from '../common/Icons';

export default function PetDisplay({ activePet, onCartillaClick, onClothesClick, onRemindersClick, remindersCount }) {
  // Construcción de la URL de la imagen real
  const imageUrl = activePet?.imagen 
    ? `http://localhost:3000/uploads/${activePet.imagen}` 
    : null;

  // Estilo común para los botones laterales
  const sideButtonStyle = "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white shadow-[0_10px_25px_-5px_rgba(45,155,150,0.4)] relative group overflow-hidden bg-gradient-to-br from-[#5fc4b8] to-[#2d9b96] hover:scale-110 active:scale-95";

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-10">
      
      {/* Botón Flotantes Izquierdos */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <button onClick={onClothesClick} className={sideButtonStyle} title="Vestidor">
          {/* Brillo de reflejo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="group-hover:rotate-12 transition-transform scale-110 relative z-10">
            <HangerIcon />
          </div>
        </button>
      </div>

      {/* Botón Flotantes Derechas */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <button onClick={onRemindersClick} className={sideButtonStyle} title="Recordatorios">
          {/* Brillo de reflejo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="group-hover:rotate-12 transition-transform scale-110 relative z-10">
            <BellIcon />
          </div>
          {remindersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white animate-bounce-gentle shadow-lg z-20">
              {remindersCount}
            </span>
          )}
        </button>
      </div>

      {/* Visualización de la Mascota */}
      <div 
        className="relative group cursor-pointer"
        onClick={onCartillaClick}
      >
        {/* Aura de fondo */}
        <div className="absolute inset-0 bg-[#3aaba5]/20 rounded-full blur-3xl group-hover:bg-[#3aaba5]/30 transition-colors duration-700 scale-150 animate-pulse"></div>
        
        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white/40 backdrop-blur-sm rounded-[4rem] border-8 border-white/50 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-700 group-hover:scale-[1.05] group-hover:rotate-1">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={activePet.nombre} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-9xl animate-float-gentle drop-shadow-2xl">
                {activePet.realAvatar || '🐾'}
              </span>
            </div>
          )}
          
          {/* Overlay de hover */}
          <div className="absolute inset-0 bg-[#2d9b96]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="bg-white/90 px-6 py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform font-black text-[#2d9b96] text-xs uppercase tracking-widest border-2 border-[#2d9b96]/10">
               Ver cartilla
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
