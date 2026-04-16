import React from 'react';
import { ClockIcon } from '../common/Icons';

export default function InfoBubble({ activeReminder, activePetName }) {
  return (
    <div className="w-full max-w-sm mb-8 z-30 animate-float-gentle relative">
      <div className="bg-[#e6fcfb] rounded-[2rem] p-5 shadow-lg relative border-4 border-white">
        {/* Cabecera del globo de texto */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-6 py-1.5 rounded-full font-black text-lg shadow-md whitespace-nowrap">
          {activeReminder ? "¡Recordatorio!" : "¡Hola!"}
        </div>
        
        {/* Contenido */}
        <div className="mt-4 flex items-center justify-center gap-3 text-center">
          {activeReminder ? (
            <>
              <div className="flex-shrink-0 animate-pulse">
                <ClockIcon />
              </div>
              <p className="text-[#1a5d5a] font-bold text-lg leading-tight">
                {activeReminder.text} a las <br/>
                <span className="font-black">{activeReminder.time}</span>
              </p>
            </>
          ) : (
            <p className="text-[#1a5d5a] font-bold text-lg leading-tight">
              Recuerda mantener siempre agua fresca para {activePetName}.
            </p>
          )}
        </div>

        {/* El dese pa' que parezca un globo de texto */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-[#e6fcfb] border-r-[15px] border-r-transparent drop-shadow-md"></div>
        <div className="absolute -bottom-[29px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-t-[30px] border-t-white border-r-[18px] border-r-transparent -z-10"></div>
      </div>
    </div>
  );
}
