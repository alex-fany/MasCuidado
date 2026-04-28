import { useState, useMemo } from 'react';
import InfoBubble from './InfoBubble';
import PetDisplay from './PetDisplay';
import { CloseIcon } from '../common/Icons';

export default function HomeView({ activePet, reminders }) {
  const [isCartillaOpen, setIsCartillaOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  const imageUrl = activePet?.imagen 
    ? `http://localhost:3000/uploads/${activePet.imagen}` 
    : null;

  // FILTRO ESTRICTO: Solo recordatorios de la mascota activa
  const petReminders = useMemo(() => {
    if (!activePet) return [];
    return reminders.filter(r => r.mascotaId === activePet.id);
  }, [reminders, activePet]);

  // 1. Recordatorio más próximo de HOY para el InfoBubble
  const todaysReminder = useMemo(() => {
    const today = new Date().toDateString();
    return petReminders.filter(r => new Date(r.fechaHora).toDateString() === today)
                       .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))[0] || null;
  }, [petReminders]);

  // 2. Próximos eventos
  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return petReminders.filter(r => {
      const rDate = new Date(r.fechaHora);
      return rDate >= now && rDate <= nextWeek;
    }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }, [petReminders]);

  return (
    <>
      <main className="flex-1 w-full flex flex-col items-center justify-start relative px-4 overflow-visible">
        <div className="w-full max-w-2xl flex justify-center pt-2 md:pt-4 shrink-0">
          <InfoBubble activeReminder={todaysReminder} activePet={activePet} />
        </div>

        <div className="w-full max-w-2xl flex flex-col items-center justify-center -mt-6 md:-mt-8 flex-1">
          <PetDisplay 
            activePet={activePet}
            onCartillaClick={() => setIsCartillaOpen(true)}
            onClothesClick={() => {}}
            onRemindersClick={() => setIsRemindersModalOpen(true)}
            remindersCount={upcomingReminders.length} 
          />
        </div>
      </main>

      {/* Modal Recordatorios */}
      {isRemindersModalOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[320px] p-6 shadow-2xl relative animate-in zoom-in-95 slide-in-from-top-4 duration-500 border border-[#3aaba5]/20 flex flex-col max-h-[70vh]">
            <button onClick={() => setIsRemindersModalOpen(false)} className="absolute top-5 right-5 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-xl font-black text-[#2d9b96] mb-1 text-left italic tracking-tight">Agenda Semanal</h2>
            <p className="text-gray-400 font-bold text-[8px] uppercase tracking-widest mb-5 text-left shrink-0">Actividades de {activePet?.nombre}</p>
            
            <div className="space-y-3 mb-6 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {upcomingReminders.length > 0 ? upcomingReminders.map(r => (
                <div key={r.id} className="p-3.5 bg-white rounded-xl border border-[#3aaba5]/10 flex justify-between items-center transition-all duration-300 hover:bg-teal-50 group">
                  <div className="text-left">
                    <p className="font-black text-[#2d9b96] text-xs leading-tight group-hover:text-[#1a5d5a]">{r.titulo}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase italic">
                      {new Date(r.fechaHora).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="font-black text-white bg-[#3aaba5] px-2 py-0.5 rounded-md text-[8px] shadow-sm shrink-0">
                    {new Date(r.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <div className="text-center py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-[#f0fdfa] rounded-full flex items-center justify-center text-2xl opacity-40">🗓️</div>
                  <p className="text-[#2d9b96] font-black text-xs uppercase italic text-center opacity-60">Sin eventos</p>
                </div>
              )}
            </div>
            
            <button onClick={() => setIsRemindersModalOpen(false)} className="w-full py-3 bg-[#f0fdfa] text-[#2d9b96] font-black rounded-xl border-2 border-[#3aaba5]/20 hover:bg-[#2d9b96] hover:text-white transition-all text-[10px] uppercase tracking-widest shrink-0 active:scale-95">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Cartilla */}
      {isCartillaOpen && (
        <div className="fixed inset-0 bg-[#0a1f1e]/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl relative border border-[#3aaba5]/20 flex flex-col max-h-[82vh] animate-in zoom-in-95 slide-in-from-top-4 duration-500 overflow-hidden">
            <button onClick={() => setIsCartillaOpen(false)} className="absolute top-6 right-6 hover:scale-110 active:scale-90 transition-transform duration-200 z-10 bg-[#f0fdfa] p-1.5 rounded-full shadow-sm border border-[#3aaba5]/10"><CloseIcon /></button>
            
            <div className="flex items-center gap-4 mb-6 shrink-0 pr-10">
               <div className="w-16 h-16 rounded-2xl bg-[#f0fdfa] border-2 border-white shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                  {imageUrl ? <img src={imageUrl} alt={activePet?.nombre} className="w-full h-full object-cover" /> : <span className="text-3xl">{activePet?.realAvatar || '🐾'}</span>}
               </div>
               <div className="text-left min-w-0">
                  <p className="text-[8px] font-black text-[#2d9b96] uppercase tracking-widest italic opacity-70">Expediente Médico</p>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight truncate">{activePet?.nombre || "Tu Mascota"}</h2>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4 text-left">
              <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10"><p className="text-[8px] font-black text-[#2d9b96] uppercase italic mb-0.5 opacity-60">Especie</p><p className="font-bold text-gray-700 text-sm">{activePet?.tipo || "---"}</p></div>
                  <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10"><p className="text-[8px] font-black text-[#2d9b96] uppercase italic mb-0.5 opacity-60">Raza</p><p className="font-bold text-gray-700 text-sm truncate">{activePet?.raza || "---"}</p></div>
                  <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10"><p className="text-[8px] font-black text-[#2d9b96] uppercase italic mb-0.5 opacity-60">Edad</p><p className="font-bold text-gray-700 text-sm">{activePet?.edad ? `${activePet.edad} años` : "---"}</p></div>
                  <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10"><p className="text-[8px] font-black text-[#2d9b96] uppercase italic mb-0.5 opacity-60">Género</p><p className="font-bold text-gray-700 text-sm">{activePet?.genero || "---"}</p></div>
              </div>

              <div className="bg-[#f0fdfa] p-3 rounded-2xl border border-[#3aaba5]/10"><p className="text-[8px] font-black text-[#2d9b96] uppercase italic mb-0.5 opacity-60">Peculiaridades</p><p className="font-bold text-gray-700 text-[10px] leading-relaxed italic">"{activePet?.color || "Color no definido"}. {activePet?.senasParticulares || "Sin marcas especiales"}"</p></div>

              <div className="p-4 bg-purple-50/50 rounded-3xl border border-purple-100 shadow-sm text-left">
                <h3 className="text-purple-600 font-black text-[9px] uppercase mb-3 flex items-center gap-2 tracking-widest italic">🧬 Notas Médicas</h3>
                <div className="space-y-3">
                  <div><p className="text-[9px] font-bold text-purple-400 uppercase mb-0.5">Padecimientos:</p><p className="text-[10px] text-gray-700 font-bold leading-relaxed">{activePet?.padecimientos || "Sin registros"}</p></div>
                  <div className="pt-2 border-t border-purple-200/30"><p className="text-[9px] font-bold text-purple-400 uppercase mb-0.5">Medicamentos:</p><p className="text-[10px] text-gray-700 font-bold leading-relaxed">{activePet?.medicamentos || "Ninguno"}</p></div>
                </div>
              </div>

              {activePet?.clinicasFavoritas?.length > 0 && (
                <div className="p-4 bg-teal-50/50 rounded-3xl border border-teal-100 shadow-sm text-left">
                  <h3 className="text-[#2d9b96] font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest italic">📍 Veterinaria</h3>
                  <p className="font-black text-gray-800 text-xs">{activePet.clinicasFavoritas[0].nombre}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5 line-clamp-1">{activePet.clinicasFavoritas[0].direccion}</p>
                </div>
              )}
            </div>

            {/* Botón Finalizar */}
            <button 
              onClick={() => setIsCartillaOpen(false)} 
              className="w-full py-2.5 bg-gradient-to-r from-[#5fc4b8] to-[#2d9b96] text-white font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 group active:translate-y-0.5 border-b-4 border-black/10 shrink-0"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                <span className="text-lg leading-none">✓</span>
              </div>
              <span className="text-xs uppercase tracking-[0.1em] italic text-white">Finalizar revisión</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
