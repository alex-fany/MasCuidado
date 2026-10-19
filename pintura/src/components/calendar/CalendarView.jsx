import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon, GoogleCalendarBrandIcon, CloseIcon } from '../common/Icons';
import AddReminderModal from '../layout/AddReminderModal';
import EditCartillaModal from '../layout/EditCartillaModal';
import { useSettings } from '../../context/SettingsContext';

export default function CalendarView({ activePet, pets, onRefreshRemindersGlobal, onPetUpdated }) {
  const { t, language } = useSettings();
  const [currentDate, setCurrentMonth] = useState(new Date());
  const today = new Date();
  const [reminders, setReminders] = useState([]);
  const [nutriEvents, setNutriEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState(null);

  const [selectedVaccineGroup, setSelectedVaccineGroup] = useState(null);
  const [isEditCartillaOpen, setIsEditCartillaOpen] = useState(false);
  const [prefillVaccine, setPrefillVaccine] = useState(null);
  const [petForCartilla, setPetForCartilla] = useState(null);

  const fetchReminders = useCallback(async (toastType = null) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      // Obtener Recordatorios
      const resRem = await fetch("/api/recordatorios", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataRem = await resRem.json();
      if (resRem.ok) setReminders(dataRem);

      // Obtener Eventos de Nutrición
      const resNutri = await fetch("/api/nutricion/eventos", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataNutri = await resNutri.json();
      if (resNutri.ok) setNutriEvents(dataNutri);

      if (onRefreshRemindersGlobal) onRefreshRemindersGlobal(toastType);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [onRefreshRemindersGlobal]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Helper para normalizar fechas
  const normalizeDate = (dateString) => {
    const d = new Date(dateString);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset);
  };

  // Unificación de eventos
  const allEvents = useMemo(() => {
    const events = [];

    // Añadir Recordatorios
    reminders.forEach(r => {
      events.push({
        id: `rem-${r.id}`,
        titulo: r.titulo,
        fecha: normalizeDate(r.fechaHora),
        type: 'reminder',
        pet: r.mascota,
        originalData: r
      });
    });

    // Añadir Eventos de Nutrición (Predicciones)
    nutriEvents.forEach(e => {
        events.push({
            id: e.id,
            titulo: `${t('nutri_calendar_event')} (${e.titulo})`,
            fecha: normalizeDate(e.fecha),
            type: 'food_depletion',
            pet: e.pet,
            originalData: e
        });
    });

    // Añadir vacunas de todos los pets registrados
    pets.forEach(pet => {
      pet.vacunas?.forEach(v => {
        // Dosis Pasada
        events.push({
          id: `vac-past-${v.id}`,
          titulo: `${language === 'en' ? 'Applied' : language === 'pt' ? 'Aplicada' : 'Aplicada'}: ${v.nombreVacuna}`,
          fecha: normalizeDate(v.fechaAplicacion),
          type: 'vaccine_past',
          vaccineName: v.nombreVacuna,
          pet: pet
        });

        // Refuerzo Futuro (si existe)
        if (v.proximaDosis) {
          events.push({
            id: `vac-future-${v.id}`,
            titulo: `${t('form_vac_next_reinf')}: ${v.nombreVacuna}`,
            fecha: normalizeDate(v.proximaDosis),
            type: 'vaccine_future',
            vaccineName: v.nombreVacuna,
            pet: pet
          });
        }
      });
    });

    return events;
  }, [reminders, nutriEvents, pets, t, language]);

  const monthNames = language === 'en' 
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : language === 'pt'
    ? ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    : ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const dayNames = language === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : language === 'pt'
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentYear, currentMonth - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentYear, currentMonth + 1));

  const selectedDayEvents = allEvents.filter(e => {
    return e.fecha.getDate() === selectedDate.getDate() && 
           e.fecha.getMonth() === selectedDate.getMonth() && 
           e.fecha.getFullYear() === selectedDate.getFullYear();
  }).sort((a, b) => a.fecha - b.fecha);

  const totalCells = firstDayOfMonth + daysInMonth;
  const rowCount = Math.ceil(totalCells / 7);

  const handleEventClick = (event) => {
    if (event.type === 'reminder') {
      setEditingReminder(event.originalData);
      setIsAddModalOpen(true);
    } else if (event.type.startsWith('vaccine')) {
      const records = event.pet.vacunas.filter(v => v.nombreVacuna === event.vaccineName).sort((a, b) => new Date(b.fechaAplicacion) - new Date(a.fechaAplicacion));
      setPetForCartilla(event.pet);
      setSelectedVaccineGroup({ name: event.vaccineName, records });
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingReminder(null);
  };

  const handleAddDoseFromHistory = (vaccineName) => {
    setPrefillVaccine(vaccineName);
    setSelectedVaccineGroup(null);
    setIsEditCartillaOpen(true);
  };

  const dateLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  return (
    <section className="h-full w-full max-w-5xl mx-auto flex flex-col px-3 sm:px-4 pt-0 pb-28 sm:pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto custom-scrollbar no-scrollbar text-left">
      <header className="mb-3 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 px-2 sm:px-6 shrink-0 relative z-[20]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] tracking-tighter italic text-left">{t('nav_calendar')}</h2>
          <p className="text-[var(--brand-accent)] font-black text-[8px] sm:text-[9px] uppercase tracking-[0.3em] mt-0.5 ml-1 opacity-80 italic text-left">{t('cal_plan')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--brand-primary)]/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl self-end xs:self-auto">
          <button onClick={prevMonth} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowLeftIcon /></button>
          <div className="bg-[var(--brand-surface)] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-inner border border-[var(--brand-primary)]/40 min-w-[110px] sm:min-w-[130px]">
            <p className="text-[var(--brand-primary)] font-black text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-center italic">{monthNames[currentMonth]} <span className="opacity-40">{currentYear}</span></p>
          </div>
          <button onClick={nextMonth} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowRightIcon /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 relative z-[10] pb-4">
        <div className="lg:col-span-7 bg-[var(--brand-surface-glass)] backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-3.5 sm:p-5 border-2 sm:border-4 border-[var(--brand-border-strong)] shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2.5 sm:mb-4 mt-1 shrink-0 px-0.5 sm:px-1">
            {dayNames.map((d, index) => (
              <div key={index} className="text-center text-[var(--brand-primary)] font-black text-[8px] sm:text-[9px] opacity-40 uppercase tracking-[0.1em] italic">{d}</div>
            ))}
          </div>
          <div 
            className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 overflow-visible text-left px-0.5 sm:px-1"
            style={{ gridTemplateRows: `repeat(${rowCount}, minmax(36px, 1fr))` }}
          >
            {blanks.map(b => <div key={`b-${b}`} className="w-full h-full min-h-[36px] sm:min-h-[44px]" />)}
            {days.map(d => {
              const dateObj = new Date(currentYear, currentMonth, d);
              const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const isSelected = d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
              
              const dayEvents = allEvents.filter(e => 
                e.fecha.getDate() === d && e.fecha.getMonth() === currentMonth && e.fecha.getFullYear() === currentYear
              );

              return (
                <button key={d} onClick={() => setSelectedDate(dateObj)} className={`w-full h-full min-h-[36px] sm:min-h-[44px] py-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-[11px] sm:text-xs font-black ${isSelected ? 'bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] shadow-lg scale-105 z-10 border-2 border-[var(--brand-border-strong)]' : isToday ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-sm' : 'text-[var(--brand-text)] opacity-70 hover:opacity-100 hover:bg-[var(--brand-surface)] hover:text-[var(--brand-primary)] hover:scale-105 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10'}`}>
                  {d}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 sm:bottom-1.5 flex gap-0.5">
                       {dayEvents.map((e, idx) => (
                         <span key={idx} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSelected ? 'bg-[var(--brand-button-text)]' : e.type.startsWith('vaccine') ? 'bg-purple-500' : e.type === 'food_depletion' ? 'bg-orange-500' : 'bg-[var(--brand-primary)]'} ${isSelected ? '' : 'animate-pulse'}`} />
                       ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 overflow-visible">
          <div className="bg-[var(--brand-modal-gradient)] backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 border-2 sm:border-4 border-[var(--brand-border-strong)] shadow-2xl flex flex-col border-dashed border-[var(--brand-secondary)]/30 overflow-hidden relative min-h-[280px]">
            <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0 px-1 relative z-10">
               <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1 rounded-full bg-[var(--brand-primary)]/10 shadow-sm border border-[var(--brand-primary)]/20 scale-90"><ClockIcon /></div>
                <h3 className="text-lg sm:text-xl font-black text-[var(--brand-text)] tracking-tighter italic text-left">{t('cal_events')}</h3>
              </div>
              <div className="bg-[var(--brand-surface)]/50 px-2.5 py-1 rounded-full border border-[var(--brand-primary)]/20 shadow-sm backdrop-blur-sm">
                <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase tracking-tighter italic">{selectedDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
            
            <div className="max-h-[260px] lg:max-h-[380px] overflow-y-auto pr-1 custom-scrollbar space-y-2 sm:space-y-2.5 pb-3 px-0.5">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(event => (
                  <div key={event.id} onClick={() => handleEventClick(event)} className={`p-2.5 sm:p-3 rounded-[1.4rem] sm:rounded-[1.8rem] border flex items-center gap-3 transition-all duration-300 group shadow-sm cursor-pointer relative shrink-0 ${event.type.startsWith('vaccine') ? 'bg-purple-600/10 border-purple-500/20 hover:bg-purple-600/15' : event.type === 'food_depletion' ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15' : 'bg-[var(--brand-surface)]/80 backdrop-blur-sm border-[var(--brand-primary)]/10 hover:bg-[var(--brand-surface)]'}`}>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[1rem] sm:rounded-[1.1rem] flex items-center justify-center overflow-hidden text-base sm:text-lg shadow-inner border shrink-0 transition-colors ${event.type.startsWith('vaccine') ? 'bg-purple-500/10 border-purple-500/20' : event.type === 'food_depletion' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-[var(--brand-surface-muted)] border-[var(--brand-primary)]/10 group-hover:bg-[var(--brand-primary)]/10'}`}>
                      {event.type === 'food_depletion' ? '🥣' : (event.pet?.imagen ? <img src={event.pet.imagen.startsWith('http') ? event.pet.imagen : `/uploads/${event.pet.imagen}`} alt="Pet" className="w-full h-full object-cover" /> : <span className="group-hover:rotate-12 transition-transform scale-90">{event.pet?.tipo === 'Perro' ? '🐶' : event.pet?.tipo === 'Gato' ? '🐱' : '🐾'}</span>)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`font-black text-xs sm:text-sm leading-tight truncate transition-colors ${event.type.startsWith('vaccine') ? 'text-purple-700' : event.type === 'food_depletion' ? 'text-orange-700' : 'text-[var(--brand-text)] group-hover:text-[var(--brand-primary)]'}`}>{event.titulo}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {event.type === 'reminder' && event.originalData.idEventoGoogle && <GoogleCalendarBrandIcon />}
                          <span className={`font-black text-[7px] uppercase tracking-tighter opacity-60 ${event.type.startsWith('vaccine') ? 'text-purple-600' : event.type === 'food_depletion' ? 'text-orange-600' : 'text-[var(--brand-primary)]'}`}>
                             {event.type.startsWith('vaccine') ? '💉' : event.type === 'food_depletion' ? '🥣' : new Date(event.originalData?.fechaHora || event.fecha).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest italic ${event.type.startsWith('vaccine') ? 'text-purple-600 opacity-80' : event.type === 'food_depletion' ? 'text-orange-600 opacity-80' : 'text-[var(--brand-text)] opacity-80'}`}>{event.pet?.nombre}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-[var(--brand-primary)]/20 rounded-[2rem] bg-[var(--brand-surface)]/30 backdrop-blur-sm py-6 shrink-0">
                  <div className="text-3xl sm:text-4xl opacity-20 filter grayscale drop-shadow-lg">🐾</div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-black text-[var(--brand-text)] opacity-40 text-xs sm:text-sm tracking-tight italic">{t('cal_no_activities')}</p>
                    <p className="text-[var(--brand-secondary)] text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{t('cal_lets_play')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-1 pt-2 shrink-0">
              <button 
                onClick={() => { setEditingReminder(null); setIsAddModalOpen(true); }}
                className="w-full py-3 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-2xl sm:rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group active:translate-y-0.5 border-b-4 border-black/10"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                  <span className="text-base leading-none">+</span>
                </div>
                <span className="text-xs uppercase tracking-[0.1em] italic">{t('cal_schedule')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddReminderModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        pets={pets}
        onRefreshReminders={(success) => fetchReminders(success ? (editingReminder ? 'updated' : 'registered') : null)}
        initialDate={selectedDate}
        editReminder={editingReminder}
        activePetId={activePet?.id}
      />

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
                          <p className={`text-xs font-black ${i === 0 ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text)] opacity-40'}`}>
                             {t('form_vac_applied')} {new Date(rec.fechaAplicacion).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {rec.proximaDosis && (
                             <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">✨ {t('form_vac_next')}: {new Date(rec.proximaDosis).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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

      {isEditCartillaOpen && (
        <EditCartillaModal 
          isOpen={isEditCartillaOpen}
          onClose={() => { setIsEditCartillaOpen(false); setPrefillVaccine(null); }}
          pet={petForCartilla}
          onSave={() => onPetUpdated(false)}
          prefillVaccineName={prefillVaccine}
        />
      )}
    </section>
  );
}
