import React, { useState, useMemo } from 'react';
import InfoBubble from './InfoBubble';
import PetDisplay from './PetDisplay';
import { CloseIcon } from '../common/Icons';
import EditCartillaModal from '../layout/EditCartillaModal';
import { useSettings } from '../../context/SettingsContext';

export default function HomeView({ activePet, reminders, onPetUpdated }) {
  const { t, language } = useSettings();
  const [isCartillaOpen, setIsCartillaOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isEditCartillaOpen, setIsEditCartillaOpen] = useState(false);

  // Recordatorios filtrados
  const petReminders = useMemo(() => {
    if (!activePet) return [];
    return reminders.filter(r => r.mascotaId === activePet.id);
  }, [reminders, activePet]);

  const todaysReminder = useMemo(() => {
    const today = new Date().toDateString();
    return petReminders.filter(r => new Date(r.fechaHora).toDateString() === today)
                       .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))[0] || null;
  }, [petReminders]);

  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return petReminders.filter(r => {
      const rDate = new Date(r.fechaHora);
      return rDate >= now && rDate <= nextWeek;
    }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }, [petReminders]);

  if (!activePet) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/80 p-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl mb-4 border-2 border-white/30">🐾</div>
        <h3 className="text-2xl font-black italic">{t('home_no_pets')}</h3>
      </div>
    );
  }

  const dateLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';
  const favoriteClinic = activePet.clinicasFavoritas?.[0] || null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <main className="w-full flex-1 flex flex-col items-center px-4 justify-center">
        <div className="w-full max-w-2xl flex justify-center shrink-0">
          <InfoBubble activeReminder={todaysReminder} activePet={activePet} />
        </div>

        <div className="w-full max-w-2xl flex flex-col items-center justify-center -mt-6 md:-mt-8 shrink-0">
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
        <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] w-full max-w-[320px] p-6 shadow-2xl relative animate-in zoom-in-95 slide-in-from-top-4 duration-500 border border-[var(--brand-primary)]/20 flex flex-col max-h-[70vh]">
            <button onClick={() => setIsRemindersModalOpen(false)} className="absolute top-5 right-5 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-xl font-black text-[var(--brand-primary)] mb-1 text-left italic tracking-tight">{t('home_weekly_agenda')}</h2>
            <p className="text-[var(--brand-text)] opacity-60 font-bold text-[8px] uppercase tracking-widest mb-5 text-left shrink-0">{t('home_activities_of')} {activePet?.nombre}</p>

            <div className="space-y-3 mb-6 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {upcomingReminders.length > 0 ? upcomingReminders.map(r => (
                <div key={r.id} className="p-3.5 bg-[var(--brand-surface)] rounded-xl border border-[var(--brand-primary)]/10 flex justify-between items-center transition-all duration-300 hover:bg-[var(--brand-primary)]/5 group">
                  <div className="text-left">
                    <p className="font-black text-[var(--brand-primary)] text-xs leading-tight group-hover:text-[var(--brand-text)]">{r.titulo}</p>
                    <p className="text-[9px] text-[var(--brand-text)] opacity-40 font-bold mt-0.5 uppercase italic">
                      {new Date(r.fechaHora).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(r.fechaHora).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/5 flex items-center justify-center text-[var(--brand-primary)] opacity-40 group-hover:scale-110 transition-transform">
                     🔔
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center opacity-30">
                   <div className="text-3xl mb-2">🎈</div>
                   <p className="text-[10px] font-black uppercase tracking-widest">{t('home_no_activities')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cartilla Médica */}
      {isCartillaOpen && (
        <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-xl z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div 
             className="bg-[var(--brand-modal-bg)] rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[var(--brand-border-strong)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden"
             style={{ background: 'var(--brand-modal-gradient)' }}
           >
              <button onClick={() => setIsCartillaOpen(false)} className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-50 bg-[var(--brand-surface-muted)] p-2 rounded-full shadow-sm">
                <CloseIcon />
              </button>
              
              <div className="flex items-center gap-4 mb-8 text-left shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/20 flex items-center justify-center text-4xl shadow-inner">
                   {activePet.realAvatar}
                </div>
                <div>
                   <h2 className="text-3xl font-black text-[var(--brand-primary)] italic tracking-tighter leading-none">{activePet.nombre}</h2>
                   <p className="text-[10px] font-black text-[var(--brand-text)] opacity-40 uppercase tracking-[0.2em] mt-1 italic">{t(`pet_${activePet.tipo.toLowerCase()}`)} • {activePet.raza}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 text-left">
                 
                 {/* Sección: Datos Médicos */}
                 <section className="bg-[var(--brand-surface-muted)] p-6 rounded-[2rem] border border-[var(--brand-primary)]/5 relative group shadow-inner">
                    <button 
                      onClick={() => setIsEditCartillaOpen(true)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                      ✎
                    </button>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-4 italic opacity-80">{t('form_medical_data')}</h3>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-1 ml-1">{t('form_medications')}</p>
                          <div className="p-3 bg-white/40 dark:bg-black/20 rounded-xl text-xs font-bold text-[var(--brand-text)] shadow-sm">
                             {activePet.medicamentos || t('form_none')}
                          </div>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-1 ml-1">{t('form_conditions')}</p>
                          <div className="p-3 bg-white/40 dark:bg-black/20 rounded-xl text-xs font-bold text-[var(--brand-text)] shadow-sm">
                             {activePet.padecimientos || t('form_none')}
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Sección: Clínica Favorita */}
                 <section className="bg-gradient-to-br from-[var(--brand-primary)]/5 to-[var(--brand-secondary)]/5 p-6 rounded-[2rem] border border-[var(--brand-primary)]/10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-3 ml-1 italic opacity-80">{t('form_fav_clinic')}</h3>
                    {favoriteClinic ? (
                      <div className="p-4 bg-[var(--brand-surface)] rounded-2xl border border-[var(--brand-primary)]/10 flex items-start gap-3 shadow-sm">
                        <div className="text-2xl mt-1">🏥</div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-[var(--brand-text)] leading-tight">{favoriteClinic.nombre}</p>
                          <p className="text-[9px] font-bold text-[var(--brand-text)] opacity-50 mt-1 leading-snug">{favoriteClinic.direccion}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-[var(--brand-primary)]/20 text-center py-6">
                        <p className="text-[10px] font-black text-[var(--brand-text)] opacity-30 uppercase tracking-widest">{t('form_fav_clinic_none')}</p>
                      </div>
                    )}
                 </section>

                 {/* Sección: Vacunas */}
                 <section className="pb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-3 ml-2 italic opacity-80">{t('form_vaccines')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                       <div className="p-4 bg-[var(--brand-surface)] rounded-2xl border border-[var(--brand-primary)]/10 flex justify-between items-center italic shadow-sm hover:scale-[1.02] transition-transform">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs font-black text-[var(--brand-text)]">{t('form_rabies')}</span>
                          </div>
                          <span className="text-[9px] font-bold opacity-40 uppercase">{t('form_january')} 2026</span>
                       </div>
                    </div>
                 </section>
              </div>

              <div className="pt-6 shrink-0">
                 <button onClick={() => setIsCartillaOpen(false)} className="w-full py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-2xl shadow-xl hover:bg-[var(--brand-secondary)] transition-all uppercase tracking-widest text-xs italic active:scale-95">{t('form_close_record')}</button>
              </div>
           </div>
        </div>
      )}

      {isEditCartillaOpen && (
        <EditCartillaModal 
          isOpen={isEditCartillaOpen}
          onClose={() => setIsEditCartillaOpen(false)}
          pet={activePet}
          onSave={async (formData) => {
             const token = localStorage.getItem('token');
             try {
               const res = await fetch(`/api/mascotas/${activePet.id}`, {
                 method: "PUT",
                 headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                 body: JSON.stringify(formData)
               });
               if (res.ok) onPetUpdated();
             } catch (err) {
               console.error("Error updating cartilla:", err);
             }
          }}
        />
      )}
    </div>
  );
}
