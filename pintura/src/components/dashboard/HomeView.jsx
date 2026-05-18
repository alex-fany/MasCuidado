import React, { useState, useMemo } from 'react';
import InfoBubble from './InfoBubble';
import PetDisplay from './PetDisplay';
import { CloseIcon, CheckIcon } from '../common/Icons';
import EditCartillaModal from '../layout/EditCartillaModal';
import NutricionModal from '../layout/NutricionModal';
import { useSettings } from '../../context/SettingsContext';

export default function HomeView({ activePet, reminders, onPetUpdated }) {
  const { t, language } = useSettings();
  const [isCartillaOpen, setIsCartillaOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isEditCartillaOpen, setIsEditCartillaOpen] = useState(false);
  const [isNutricionModalOpen, setIsNutricionModalOpen] = useState(false);
  const [isWaterConfirmOpen, setIsWaterConfirmOpen] = useState(false);
  const [nutricionRefreshKey, setNutricionRefreshKey] = useState(0);
  const [isWaterLoading, setIsWaterLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedVaccineGroup, setSelectedVaccineGroup] = useState(null);
  const [prefillVaccine, setPrefillVaccine] = useState(null);

  const dateLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  const formatLocalDate = (dateString, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString(dateLocale, options);
  };

  const handleNutricionSave = () => {
    setNutricionRefreshKey(prev => prev + 1);
  };

  const handleAddWaterConfirm = async () => {
    if (!activePet || isWaterLoading) return;
    setIsWaterLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/nutricion/${activePet.id}/agua`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ cantidad: 1 })
      });
      if (res.ok) {
        setNutricionRefreshKey(prev => prev + 1);
        setIsWaterConfirmOpen(false);
      }
    } catch (err) {
      console.error("Error al registrar agua:", err);
    } finally {
      setIsWaterLoading(false);
    }
  };

  // Recordatorios unificados
  const allEvents = useMemo(() => {
    if (!activePet) return [];

    // Recordatorios de la base de datos
    const dbReminders = reminders
      .filter(r => r.mascotaId === activePet.id)
      .map(r => ({ ...r, type: 'reminder' }));

    // Refuerzos de vacunas
    const seenVaccines = new Set();
    const vaccineReinforcements = (activePet.vacunas || [])
      .filter(v => v.proximaDosis && !seenVaccines.has(v.nombreVacuna))
      .map(v => {
        seenVaccines.add(v.nombreVacuna);
        return {
          id: `vaccine-${v.id}`,
          titulo: `${t('form_vac_next_reinf')}: ${v.nombreVacuna}`,
          fechaHora: v.proximaDosis,
          type: 'vaccine',
          mascotaId: activePet.id
        };
      });

    // Combinar y ordenar cronológicamente
    return [...dbReminders, ...vaccineReinforcements].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }, [reminders, activePet, t]);

  const todaysReminder = useMemo(() => {
    const today = new Date();
    // Comparación segura ignorando horas
    return allEvents.filter(e => {
      const eDate = new Date(e.fechaHora);
      const userTimezoneOffset = eDate.getTimezoneOffset() * 60000;
      const correctedDate = new Date(eDate.getTime() + userTimezoneOffset);
      return correctedDate.toDateString() === today.toDateString();
    })[0] || null;
  }, [allEvents]);

  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return allEvents.filter(e => {
      const eDate = new Date(e.fechaHora);
      const userTimezoneOffset = eDate.getTimezoneOffset() * 60000;
      const correctedDate = new Date(eDate.getTime() + userTimezoneOffset);
      return correctedDate >= now && correctedDate <= nextWeek;
    });
  }, [allEvents]);

  // Agrupar vacunas por nombre para el historial
  const vaccineGroups = useMemo(() => {
    if (!activePet?.vacunas) return [];
    const groups = {};
    activePet.vacunas.forEach(v => {
      if (!groups[v.nombreVacuna]) groups[v.nombreVacuna] = [];
      groups[v.nombreVacuna].push(v);
    });
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => new Date(b.fechaAplicacion) - new Date(a.fechaAplicacion));
    });
    return groups;
  }, [activePet]);

  if (!activePet) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/80 p-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl mb-4 border-2 border-white/30">🐾</div>
        <h3 className="text-2xl font-black italic">{t('home_no_pets')}</h3>
      </div>
    );
  }

  const favoriteClinic = activePet.clinicasFavoritas?.[0] || null;

  const handleAddDoseFromHistory = (vaccineName) => {
    setPrefillVaccine(vaccineName);
    setSelectedVaccineGroup(null);
    setIsEditCartillaOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditCartillaOpen(false);
    setPrefillVaccine(null);
  };

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
            onRemindersClick={() => setIsRemindersModalOpen(true)}
            onNutricionClick={() => setIsNutricionModalOpen(true)}
            onWaterClick={() => setIsWaterConfirmOpen(true)}
            nutricionRefreshKey={nutricionRefreshKey}
            remindersCount={upcomingReminders.length}
          />
        </div>
      </main>

      {/* Modal Nutrición */}
      <NutricionModal 
        isOpen={isNutricionModalOpen}
        onClose={() => setIsNutricionModalOpen(false)}
        pet={activePet}
        onSave={handleNutricionSave}
      />

      {/* Modal Agenda Semanal */}
      {isRemindersModalOpen && (
        <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] w-full max-w-[320px] p-6 shadow-2xl relative animate-in zoom-in-95 slide-in-from-top-4 duration-500 border border-[var(--brand-primary)]/20 flex flex-col max-h-[70vh]">
            <button onClick={() => setIsRemindersModalOpen(false)} className="absolute top-5 right-5 hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
            <h2 className="text-xl font-black text-[var(--brand-primary)] mb-1 text-left italic tracking-tight">{t('home_weekly_agenda')}</h2>
            <p className="text-[var(--brand-text)] opacity-60 font-bold text-[8px] uppercase tracking-widest mb-5 text-left shrink-0">{t('home_activities_of')} {activePet?.nombre}</p>

            <div className="space-y-3 mb-6 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {upcomingReminders.length > 0 ? upcomingReminders.map(e => (
                <div key={e.id} className={`p-3.5 rounded-xl border flex justify-between items-center transition-all duration-300 hover:scale-[1.02] group ${e.type === 'vaccine' ? 'bg-purple-500/5 border-purple-500/10' : 'bg-[var(--brand-surface)] border-[var(--brand-primary)]/10'}`}>
                  <div className="text-left">
                    <p className={`font-black text-xs leading-tight ${e.type === 'vaccine' ? 'text-purple-600' : 'text-[var(--brand-primary)] group-hover:text-[var(--brand-text)]'}`}>{e.titulo}</p>
                    <p className="text-[9px] text-[var(--brand-text)] opacity-40 font-bold mt-0.5 uppercase italic">
                      {formatLocalDate(e.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })}
                      {e.type === 'reminder' && ` • ${new Date(e.fechaHora).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform ${e.type === 'vaccine' ? 'bg-purple-500/10 text-purple-600' : 'bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'}`}>
                     {e.type === 'vaccine' ? '💉' : '🔔'}
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
                   <p className="text-[10px] font-black text-[var(--brand-text)] opacity-40 uppercase tracking-[0.2em] mt-1 italic">{t(`pet_${activePet.tipo?.toLowerCase()}`)} • {activePet.raza}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 text-left">
                 
                 {/* Sección: Información General */}
                 <section className="bg-[var(--brand-surface-muted)] p-6 rounded-[2rem] border border-[var(--brand-primary)]/5 relative group shadow-inner">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditCartillaOpen(true); }}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer z-20"
                    >
                      ✎
                    </button>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-4 italic opacity-80">{t('form_info_gen')}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-0.5 ml-1">{t('form_breed')}</p>
                          <p className="text-xs font-bold text-[var(--brand-text)] ml-1">{activePet.raza || t('form_none')}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-0.5 ml-1">{t('form_age')}</p>
                          <p className="text-xs font-bold text-[var(--brand-text)] ml-1">{activePet.edad ? `${activePet.edad} ${activePet.edad === 1 ? (language === 'en' ? 'year' : 'año') : (language === 'en' ? 'years' : 'años')}` : t('form_none')}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-0.5 ml-1">{t('form_color')}</p>
                          <p className="text-xs font-bold text-[var(--brand-text)] ml-1">{activePet.color || t('form_none')}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-0.5 ml-1">{t('form_weight')}</p>
                          <p className="text-xs font-bold text-[var(--brand-text)] ml-1">{activePet.peso ? `${activePet.peso} kg` : t('form_none')}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-0.5 ml-1">{t('form_gender')}</p>
                          <p className="text-xs font-bold text-[var(--brand-text)] ml-1">{t(`gender_${activePet.genero?.toLowerCase()}`)}</p>
                       </div>
                    </div>
                    <div className="pt-3 border-t border-[var(--brand-primary)]/5">
                       <p className="text-[8px] font-black uppercase text-[var(--brand-text)] opacity-40 mb-1 ml-1">{t('form_notes')}</p>
                       <p className="text-xs font-bold text-[var(--brand-text)] ml-1 italic leading-relaxed">{activePet.senasParticulares || t('form_none')}</p>
                    </div>
                 </section>

                 {/* Sección: Fotos de Cartilla Física */}
                 {activePet.fotosCartilla?.length > 0 && (
                   <section className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 italic opacity-80 ml-2">{t('form_vac_physical')}</h3>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                         {activePet.fotosCartilla.map((f, i) => (
                           <div key={i} onClick={() => setSelectedPhoto(f)} className="w-24 h-24 rounded-2xl border-2 border-emerald-500/10 overflow-hidden shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer">
                              <img src={`http://localhost:3000/uploads/${f}`} className="w-full h-full object-cover" alt="Cartilla" />
                           </div>
                         ))}
                      </div>
                   </section>
                 )}

                 {/* Sección: Vacunas */}
                 <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-2 italic opacity-80 ml-2">{t('form_vac_title')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                       {Object.keys(vaccineGroups).length > 0 ? Object.entries(vaccineGroups).map(([name, records], i) => (
                         <div 
                            key={i} 
                            onClick={() => setSelectedVaccineGroup({ name, records })}
                            className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20 flex justify-between items-center italic shadow-sm hover:bg-purple-600/15 transition-colors cursor-pointer group"
                         >
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                              <span className="text-xs font-black text-[var(--brand-text)]">{name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] font-bold opacity-40 uppercase">{t('form_vac_applied')}: {formatLocalDate(records[0].fechaAplicacion)}</span>
                               <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                            </div>
                         </div>
                       )) : (
                         <div className="p-6 bg-black/5 rounded-2xl border border-dashed border-purple-200 text-center">
                            <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Sin registro de vacunas</p>
                         </div>
                       )}
                    </div>
                 </section>

                 {/* Sección: Datos Médicos */}
                 <section className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 p-6 rounded-[2rem] border border-purple-500/20 shadow-inner">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-4 italic opacity-80">{t('form_medical_data')}</h3>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[8px] font-black uppercase text-purple-600 opacity-40 mb-1 ml-1">{t('form_medications')}</p>
                          <div className="p-3 bg-purple-600/10 border border-purple-500/10 rounded-xl text-xs font-bold text-[var(--brand-text)] shadow-sm">
                             {activePet.medicamentos || t('form_none')}
                          </div>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-purple-600 opacity-40 mb-1 ml-1">{t('form_conditions')}</p>
                          <div className="p-3 bg-purple-600/10 border border-purple-500/10 rounded-xl text-xs font-bold text-[var(--brand-text)] shadow-sm">
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
              </div>

              <div className="pt-6 shrink-0">
                 <button onClick={() => setIsCartillaOpen(false)} className="w-full py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-2xl shadow-xl hover:bg-[var(--brand-secondary)] transition-all uppercase tracking-widest text-xs italic active:scale-95">{t('form_close_record')}</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Historial de Vacuna Específica */}
      {selectedVaccineGroup && (
         <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] w-full max-w-sm p-7 shadow-2xl border-4 border-purple-500/20 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-purple-600 italic tracking-tighter leading-none">{selectedVaccineGroup.name}</h3>
                    <p className="text-[9px] font-black uppercase text-[var(--brand-text)] opacity-40 mt-1 tracking-widest">{t('form_vac_history')}</p>
                  </div>
                  <button onClick={() => setSelectedVaccineGroup(null)} className="p-1.5 rounded-full hover:bg-black/5 transition-colors">
                     <CloseIcon />
                  </button>
               </div>

               <div className="space-y-4 mb-8">
                  {selectedVaccineGroup.records.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                       <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-purple-200'}`}></div>
                          {i !== selectedVaccineGroup.records.length - 1 && <div className="w-0.5 h-12 bg-purple-100"></div>}
                       </div>
                       <div className="text-left flex-1 pb-4">
                          <p className={`text-xs font-black ${i === 0 ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text)] opacity-40'}`}>{t('form_vac_applied')} {formatLocalDate(rec.fechaAplicacion, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          {rec.proximaDosis && (
                             <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">✨ {t('form_vac_next')}: {formatLocalDate(rec.proximaDosis, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          )}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-3">
                  <button 
                    onClick={() => handleAddDoseFromHistory(selectedVaccineGroup.name)}
                    className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all uppercase tracking-widest text-[10px] active:scale-95"
                  >
                    + Registrar nueva dosis
                  </button>
                  <button onClick={() => setSelectedVaccineGroup(null)} className="w-full py-3 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-black/5 transition-all">{t('profile_back')}</button>
               </div>
            </div>
         </div>
      )}

      {/* Lightbox para ver fotos de la cartilla en grande */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[20000] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>
           <button className="absolute top-10 right-10 text-white/60 hover:text-white p-2">
              <CloseIcon />
           </button>
           <img 
             src={`http://localhost:3000/uploads/${selectedPhoto}`} 
             alt="Zoom Cartilla" 
             className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500" 
           />
        </div>
      )}

      {isEditCartillaOpen && (
        <EditCartillaModal 
          isOpen={isEditCartillaOpen}
          onClose={handleCloseEdit}
          pet={activePet}
          onSave={() => onPetUpdated(false)}
          prefillVaccineName={prefillVaccine}
        />
      )}

      {/* Modal Confirmación Agua */}
      {isWaterConfirmOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-cyan-500/20 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/10">
                <span className="text-4xl animate-bounce">💧</span>
              </div>
              <h3 className="text-cyan-600 font-black text-2xl mb-2 italic tracking-tighter">{t('nutri_water_confirm_title')}</h3>
              <p className="text-[var(--brand-text)] text-xs font-bold mb-8 leading-relaxed opacity-60">
                {t('nutri_water_confirm_desc')} <span className="text-cyan-600">{activePet?.nombre}</span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleAddWaterConfirm} 
                  disabled={isWaterLoading}
                  className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  {isWaterLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✓'}
                  {t('nutri_water_add_btn')}
                </button>
                <button onClick={() => setIsWaterConfirmOpen(false)} className="w-full py-3 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-70 transition-all">{t('profile_cancel')}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
