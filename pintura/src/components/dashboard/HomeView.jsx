import { useState } from 'react';
import InfoBubble from './InfoBubble';
import PetDisplay from './PetDisplay';
import { CloseIcon } from '../common/Icons';

export default function HomeView({ activePet, reminders, activeReminder }) {
  // Estados de visibilidad de modales específicos de la mascota
  const [isCartillaOpen, setIsCartillaOpen] = useState(false);
  const [isClothesOpen, setIsClothesOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  return (
    <>
      {/* Área Central (Globo de texto y Mascota) */}
      <main className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden px-4 pb-20">
        <div className="w-full max-w-2xl flex flex-col items-center relative justify-center">
          
          <InfoBubble 
            activeReminder={activeReminder} 
            activePetName={activePet.name} 
          />

          <PetDisplay 
            virtualAvatar={activePet.virtualAvatar}
            onCartillaClick={() => setIsCartillaOpen(true)}
            onClothesClick={() => setIsClothesOpen(true)}
            onRemindersClick={() => setIsRemindersModalOpen(true)}
            remindersCount={reminders.length}
          />
        </div>
      </main>

      {/* MODALES DE LA +COTA */}
      
      {/* Modal Cartilla */}
      {isCartillaOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#3aaba5]/20">
            <button onClick={() => setIsCartillaOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-3xl font-black text-[#2d9b96] mb-6">Cartilla de {activePet.name}</h2>
            <div className="h-64 bg-[#f0fdfa] rounded-[2rem] border-2 border-dashed border-[#3aaba5]/20 flex items-center justify-center mb-6">
              <span className="text-[#3aaba5] font-bold">Contenido Médico</span>
            </div>
            <button onClick={() => setIsCartillaOpen(false)} className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all shadow-lg shadow-[#2d9b96]/20">Cerrar Cartilla</button>
          </div>
        </div>
      )}

      {/* Modal Vestidor */}
      {isClothesOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#3aaba5]/20">
            <button onClick={() => setIsClothesOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-2xl font-black text-[#2d9b96] mb-4">Vestidor</h2>
            <p className="text-[#3aaba5] font-bold mb-8">Personaliza a {activePet.name}</p>
            <button onClick={() => setIsClothesOpen(false)} className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all shadow-lg shadow-[#2d9b96]/20">Guardar Cambios</button>
          </div>
        </div>
      )}

      {/* Modal Recordatorios Rápidos */}
      {isRemindersModalOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#3aaba5]/20">
            <button onClick={() => setIsRemindersModalOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-2xl font-black text-[#2d9b96] mb-6">Recordatorios</h2>
            <div className="space-y-4 mb-8">
              {reminders.map(r => (
                <div key={r.id} className="p-4 bg-[#f0fdfa] rounded-2xl border border-[#3aaba5]/10 flex justify-between items-center">
                  <span className="font-bold text-[#2d9b96]">{r.text}</span>
                  <span className="font-black text-white bg-[#3aaba5] px-3 py-1 rounded-lg text-sm">{r.time}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsRemindersModalOpen(false)} className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}
