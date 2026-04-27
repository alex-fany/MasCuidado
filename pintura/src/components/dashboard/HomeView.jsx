import { useState } from 'react';
import InfoBubble from './InfoBubble';
import PetDisplay from './PetDisplay';
import { CloseIcon } from '../common/Icons';

export default function HomeView({ activePet, reminders, activeReminder }) {
  // Estados de visibilidad de modales específicos de la mascota
  const [isCartillaOpen, setIsCartillaOpen] = useState(false);
  const [isClothesOpen, setIsClothesOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  // URL de la imagen si existe
  const imageUrl = activePet?.imagen 
    ? `http://localhost:3000/uploads/${activePet.imagen}` 
    : null;

  return (
    <>
      {/* Área Central (Globo de texto y Mascota) */}
      <main className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden px-4 pb-20">
        <div className="w-full max-w-2xl flex flex-col items-center relative justify-center">
          
          <InfoBubble 
            activeReminder={activeReminder} 
            activePetName={activePet.nombre} 
          />

          <PetDisplay 
            activePet={activePet}
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
        <div className="fixed inset-0 bg-[#0a1f1e]/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[#3aaba5]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsCartillaOpen(false)} 
              className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-10 bg-[#f0fdfa] p-2 rounded-full shadow-sm"
            >
              <CloseIcon />
            </button>

            <div className="flex items-center gap-6 mb-8 shrink-0">
               <div className="w-24 h-24 rounded-3xl bg-[#f0fdfa] border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={activePet.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{activePet.realAvatar || '🐾'}</span>
                  )}
               </div>
               <div>
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic">Expediente Médico</p>
                  <h2 className="text-4xl font-black text-gray-800 tracking-tighter leading-tight">
                    {activePet.nombre}
                  </h2>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 mb-6">
              
              {/* DATOS GENERALES */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                    <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Especie</p>
                    <p className="font-bold text-gray-700 text-lg">{activePet.tipo}</p>
                  </div>
                  <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                    <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Raza</p>
                    <p className="font-bold text-gray-700 text-lg">{activePet.raza || "No especificada"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                    <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Edad</p>
                    <p className="font-bold text-gray-700 text-lg">
                      {activePet.edad ? `${activePet.edad} años` : "No registrada"}
                    </p>
                  </div>
                  <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                    <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Género</p>
                    <p className="font-bold text-gray-700 text-lg">{activePet.genero}</p>
                  </div>
                </div>

                <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                  <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Color de pelaje</p>
                  <p className="font-bold text-gray-700">{activePet.color || "No definido"}</p>
                </div>

                <div className="bg-[#f0fdfa] p-4 rounded-3xl border border-[#3aaba5]/10">
                  <p className="text-[9px] font-black text-[#2d9b96] uppercase italic mb-1">Señas particulares</p>
                  <p className="font-bold text-gray-700 text-sm leading-relaxed">
                    {activePet.senasParticulares || "Ninguna marca especial registrada"}
                  </p>
                </div>
              </div>

              {/* INFORMACIÓN MÉDICA */}
              <div className="p-6 bg-purple-50 rounded-[2.5rem] border-2 border-purple-100 shadow-inner">
                <h3 className="text-purple-600 font-black text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest">
                  🧬 Información Médica
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Padecimientos:</p>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed">
                      {activePet.padecimientos || "Sin padecimientos registrados"}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-200/50">
                    <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Medicamentos:</p>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed">
                      {activePet.medicamentos || "Ninguno en la actualidad"}
                    </p>
                  </div>
                </div>
              </div>

              {/* HISTORIAL MÉDICO */}
              <div className="p-6 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 shadow-inner">
                <h3 className="text-amber-600 font-black text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest">
                  🏥 Historial Médico Reciente
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Último Evento:</p>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed">
                      {activePet.tipo_evento || "Sin eventos registrados"}
                    </p>
                  </div>
                  {activePet.fecha_evento && (
                    <div className="pt-3 border-t border-amber-200/50">
                      <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Fecha:</p>
                      <p className="text-sm text-gray-700 font-bold italic">
                        {new Date(activePet.fecha_evento).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-amber-200/50">
                    <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Descripción:</p>
                    <p className="text-sm text-gray-700 font-medium italic">
                      {activePet.descripcion || "No hay detalles adicionales."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clínica Favorita */}
              {activePet.clinicasFavoritas && activePet.clinicasFavoritas.length > 0 && (
                <div className="p-6 bg-teal-50 rounded-[2.5rem] border-2 border-teal-100 shadow-inner">
                  <h3 className="text-[#2d9b96] font-black text-[10px] uppercase mb-3 flex items-center gap-2 tracking-widest">
                    📍 Clínica de confianza
                  </h3>
                  <p className="font-black text-gray-800 text-sm">{activePet.clinicasFavoritas[0].nombre}</p>
                  <p className="text-[11px] text-gray-500 font-bold mt-1">{activePet.clinicasFavoritas[0].direccion}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsCartillaOpen(false)} 
              className="w-full py-5 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all shadow-xl shadow-[#2d9b96]/20 shrink-0 text-lg uppercase tracking-widest"
            >
              Cerrar Cartilla
            </button>

          </div>
        </div>
      )}

      {/* Modal Vestidor */}
      {isClothesOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#3aaba5]/20">
            <button onClick={() => setIsClothesOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-2xl font-black text-[#2d9b96] mb-4">Vestidor</h2>
            <p className="text-[#3aaba5] font-bold mb-8">Personaliza a {activePet.nombre}</p>
            <button onClick={() => setIsClothesOpen(false)} className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all shadow-lg shadow-[#2d9b96]/20">Guardar Cambios</button>
          </div>
        </div>
      )}

      {/* Modal Recordatorios Rápidos */}
      {isRemindersModalOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#3aaba5]/20">
            <button onClick={() => setIsRemindersModalOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-2xl font-black text-[#2d9b96] mb-6">Recordatorios</h2>
            <div className="space-y-4 mb-8">
              {reminders.length > 0 ? reminders.map(r => (
                <div key={r.id} className="p-4 bg-[#f0fdfa] rounded-2xl border border-[#3aaba5]/10 flex justify-between items-center">
                  <span className="font-bold text-[#2d9b96]">{r.text}</span>
                  <span className="font-black text-white bg-[#3aaba5] px-3 py-1 rounded-lg text-sm">{r.time}</span>
                </div>
              )) : (
                <p className="text-center text-gray-400 font-bold italic">No hay recordatorios pendientes</p>
              )}
            </div>
            <button onClick={() => setIsRemindersModalOpen(false)} className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl hover:bg-[#23807c] transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}
