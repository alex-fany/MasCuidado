import React, { useMemo } from 'react';
import { ClockIcon } from '../common/Icons';

export default function InfoBubble({ activeReminder, activePet }) {
  const tips = useMemo(() => ({
    'Perro': [
      "¡No olvides el paseo diario! Ayuda a liberar energía.",
      "El agua fresca es vital para su hidratación hoy.",
      "Un ratito de juego fortalece tu vínculo con ellos.",
      "Revisa si sus vacunas están al día este mes."
    ],
    'Gato': [
      "La limpieza de su arena es clave para su comodidad.",
      "Un rascador nuevo evitará que use tus muebles.",
      "Cepillar su pelo evita las molestas bolas de pelo.",
      "Jugar con punteros láser estimula su instinto cazador."
    ],
    'Ave': [
      "Asegúrate de que no haya corrientes de aire cerca.",
      "Las frutas frescas son un premio delicioso hoy.",
      "Limpia su bebedero para evitar bacterias.",
      "Un ratito de sol indirecto les hace muy bien."
    ],
    'Conejo': [
      "El heno debe estar siempre disponible para sus dientes.",
      "Revisa que tenga espacio suficiente para saltar hoy.",
      "Las verduras de hoja verde son sus favoritas.",
      "Un cepillado suave le ayudará a sentirse mimado."
    ],
    'Default': [
      "Recuerda mantener siempre agua fresca disponible.",
      "El cariño es la mejor medicina para tu mascota.",
      "Un chequeo preventivo al año es fundamental.",
      "Observa siempre cualquier cambio en su apetito."
    ]
  }), []);

  const randomTip = useMemo(() => {
    const speciesTips = tips[activePet?.tipo] || tips['Default'];
    return speciesTips[Math.floor(Math.random() * speciesTips.length)];
  }, [activePet, tips]);

  return (
    <div className="w-full max-w-sm mb-8 z-30 animate-float-gentle relative pointer-events-none">
      <div className="bg-[#e6fcfb] rounded-[2rem] p-5 shadow-[0_20px_40px_-15px_rgba(45,155,150,0.4)] relative border-4 border-white pointer-events-auto">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-6 py-1.5 rounded-full font-black text-lg shadow-md whitespace-nowrap">
          {activeReminder ? "¡Recordatorio!" : "¡Consejo!"}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-3 text-center min-h-[60px]">
          {activeReminder ? (
            <>
              <div className="flex-shrink-0 text-[#2d9b96]">
                <ClockIcon />
              </div>
              <p className="text-[#1a5d5a] font-bold text-lg leading-tight">
                {activeReminder.titulo} a las <br/>
                <span className="font-black">{new Date(activeReminder.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </>
          ) : (
            <p className="text-[#1a5d5a] font-bold text-lg leading-tight italic">
              {randomTip}
            </p>
          )}
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-[#e6fcfb] border-r-[15px] border-r-transparent drop-shadow-md"></div>
        <div className="absolute -bottom-[29px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-t-[30px] border-t-white border-r-[18px] border-r-transparent -z-10"></div>
      </div>
    </div>
  );
}
