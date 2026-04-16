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
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative border border-[#3aaba5]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsCartillaOpen(false)} 
              className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200 z-10"
            >
              <CloseIcon />
            </button>

            <h2 className="text-3xl font-black text-[#2d9b96] mb-6 pr-8 shrink-0">
              Cartilla de {activePet.name}
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-6">
              
              {/* Nombre */}
              <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Nombre Completo</p>
                <p className="font-bold text-gray-700">{activePet.name}</p>
              </div>

              {/* Especie y Raza */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Especie</p>
                  <p className="font-bold text-gray-700">{activePet.nombre_especie || activePet.type}</p>
                </div>
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Raza</p>
                  <p className="font-bold text-gray-700">{activePet.raza || activePet.breed}</p>
                </div>
              </div>

              {/* Color y Sexo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Color</p>
                  <p className="font-bold text-gray-700">{activePet.color || "No definido"}</p>
                </div>
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Sexo</p>
                  <p className="font-bold text-gray-700">{activePet.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                </div>
              </div>

              {/* Señas Particulares */}
              <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Señas particulares</p>
                <p className="font-bold text-gray-700 text-sm">{activePet.senas_particulares || "Ninguna registrada"}</p>
              </div>

              {/* Fecha y Edad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Nacimiento</p>
                  <p className="font-bold text-gray-700">{activePet.fecha_nacimiento || "N/A"}</p>
                </div>
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Edad aprox.</p>
                  <p className="font-bold text-gray-700">
                    {activePet.fecha_nacimiento 
                      ? `${new Date().getFullYear() - new Date(activePet.fecha_nacimiento).getFullYear()} años` 
                      : 'No registrada'}
                  </p>
                </div>
              </div>

              {/* Peso */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase italic">Peso</p>
                  <p className="font-bold text-gray-700">{activePet.peso_kg || "No definido"}</p>
                </div>
              </div>

              {/* Información Médica */}
              <div className="p-5 bg-purple-50 rounded-[2rem] border border-purple-100 shadow-inner">
                <h3 className="text-purple-600 font-black text-xs uppercase mb-3 flex items-center gap-2">
                  Información Médica
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-purple-400 uppercase">Padecimientos:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.padecimientos || "Sin padecimientos registrados"}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-200/50">
                    <p className="text-[10px] font-bold text-purple-400 uppercase">Medicamentos:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.medicamentos || "Ninguno en la actualidad"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historial Médico */}
              <div className="p-5 bg-green-50 rounded-[2rem] border border-green-100 shadow-inner">
                <h3 className="text-green-600 font-black text-xs uppercase mb-3 flex items-center gap-2">
                  Historial Médico
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-green-400 uppercase">Evento:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.tipo_evento || "Sin eventos registrados"}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-green-200/50">
                    <p className="text-[10px] font-bold text-green-400 uppercase">Fecha de evento:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.fecha_evento || "Sin fecha registrada"}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-green-200/50">
                    <p className="text-[10px] font-bold text-green-400 uppercase">Descripción del evento:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.descripcion || "Sin descripción registrada"}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-green-200/50">
                    <p className="text-[10px] font-bold text-green-400 uppercase">Veterinario y/o clínica:</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {activePet.veterinario_clinica || "Sin veterinario y/o clínica registrado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsCartillaOpen(false)} 
              className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all shadow-lg shadow-[#2d9b96]/20 shrink-0"
            >
              Cerrar Cartilla
            </button>

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
