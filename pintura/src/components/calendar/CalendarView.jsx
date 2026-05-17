import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon, GoogleCalendarBrandIcon, CloseIcon } from '../common/Icons';
import AddReminderModal from '../layout/AddReminderModal';
import { useSettings } from '../../context/SettingsContext';

export default function CalendarView({ activePet, pets, onRefreshRemindersGlobal }) {
  const { t, language } = useSettings();
  const [currentDate, setCurrentMonth] = useState(new Date());
  const today = new Date();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState(null);

  const fetchReminders = useCallback(async (toastType = null) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch("/api/recordatorios", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReminders(data);
        if (onRefreshRemindersGlobal) onRefreshRemindersGlobal(toastType);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [onRefreshRemindersGlobal]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

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

  const selectedDayReminders = reminders.filter(r => {
    const rDate = new Date(r.fechaHora);
    return rDate.getDate() === selectedDate.getDate() && 
           rDate.getMonth() === selectedDate.getMonth() && 
           rDate.getFullYear() === selectedDate.getFullYear();
  });

  const totalCells = firstDayOfMonth + daysInMonth;
  const rowCount = Math.ceil(totalCells / 7);

  const handleEditReminder = (rem) => {
    setEditingReminder(rem);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingReminder(null);
  };

  const dateLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  return (
    <section className="h-full w-full max-w-5xl mx-auto flex flex-col px-4 pt-0 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden text-left">
      <header className="mb-3 flex justify-between items-center px-6 shrink-0 relative z-[20]">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] tracking-tighter italic text-left">{t('nav_calendar')}</h2>
          <p className="text-[var(--brand-accent)] font-black text-[9px] uppercase tracking-[0.3em] mt-0.5 ml-1 opacity-80 italic text-left">{t('cal_plan')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--brand-primary)]/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowLeftIcon /></button>
          <div className="bg-[var(--brand-surface)] px-4 py-1.5 rounded-full shadow-inner border border-[var(--brand-primary)]/40 min-w-[130px]">
            <p className="text-[var(--brand-primary)] font-black text-[9px] uppercase tracking-[0.2em] text-center italic">{monthNames[currentMonth]} <span className="opacity-40">{currentYear}</span></p>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowRightIcon /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 max-h-[100%] overflow-visible relative z-[10] pb-2 min-h-0">
        <div className="lg:col-span-7 bg-[var(--brand-surface-glass)] backdrop-blur-xl rounded-[2.5rem] p-5 border-4 border-[var(--brand-border-strong)] shadow-2xl flex flex-col h-full animate-in zoom-in-95 duration-500 relative overflow-hidden min-h-0">
          <div className="grid grid-cols-7 gap-1.5 mb-4 mt-1 shrink-0 px-1">
            {dayNames.map((d, index) => (
              <div key={index} className="text-center text-[var(--brand-primary)] font-black text-[9px] opacity-40 uppercase tracking-[0.1em] italic">{d}</div>
            ))}
          </div>
          <div 
            className="grid grid-cols-7 gap-1.5 flex-1 overflow-visible text-left min-h-0 px-1"
            style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
          >
            {blanks.map(b => <div key={`b-${b}`} className="w-full h-full" />)}
            {days.map(d => {
              const dateObj = new Date(currentYear, currentMonth, d);
              const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const isSelected = d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
              const hasReminders = reminders.some(r => {
                const rDate = new Date(r.fechaHora);
                return rDate.getDate() === d && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
              });
              return (
                <button key={d} onClick={() => setSelectedDate(dateObj)} className={`w-full h-full rounded-xl lg:rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-xs font-black ${isSelected ? 'bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] shadow-lg scale-105 z-10 border-2 border-[var(--brand-border-strong)]' : isToday ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-sm' : 'text-[var(--brand-text)] opacity-70 hover:opacity-100 hover:bg-[var(--brand-surface)] hover:text-[var(--brand-primary)] hover:scale-105 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10'}`}>
                  {d}
                  {hasReminders && <span className={`absolute bottom-1.5 lg:bottom-2 w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${isSelected ? 'bg-[var(--brand-button-text)]' : 'bg-[var(--brand-primary)]'} ${isSelected ? '' : 'animate-pulse'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 h-full min-h-0 overflow-visible">
          <div className="bg-[var(--brand-modal-gradient)] backdrop-blur-xl rounded-[2.5rem] p-5 border-4 border-[var(--brand-border-strong)] shadow-2xl flex flex-col h-full border-dashed border-[var(--brand-secondary)]/30 overflow-hidden px-4 min-h-0 relative">
            <div className="flex items-center justify-between mb-4 shrink-0 px-1 relative z-10">
               <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-full bg-[var(--brand-primary)]/10 shadow-sm border border-[var(--brand-primary)]/20 scale-90"><ClockIcon /></div>
                <h3 className="text-xl font-black text-[var(--brand-text)] tracking-tighter italic text-left">{t('cal_events')}</h3>
              </div>
              <div className="bg-[var(--brand-surface)]/50 px-2.5 py-1 rounded-full border border-[var(--brand-primary)]/20 shadow-sm backdrop-blur-sm">
                <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase tracking-tighter italic">{selectedDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5 pb-4 px-1 overflow-x-visible min-h-0">
              {selectedDayReminders.length > 0 ? (
                selectedDayReminders.map(rem => (
                  <div key={rem.id} onClick={() => handleEditReminder(rem)} className="bg-[var(--brand-surface)]/80 backdrop-blur-sm p-3 rounded-[1.8rem] border border-[var(--brand-primary)]/10 flex items-center gap-3.5 transition-all duration-300 group shadow-sm hover:shadow-[inset_0_0_0_2px_rgba(45,155,150,0.2)] hover:bg-[var(--brand-surface)] cursor-pointer relative shrink-0">
                    <div className="w-9 h-9 bg-[var(--brand-surface-muted)] rounded-[1.1rem] flex items-center justify-center overflow-hidden text-lg shadow-inner border border-[var(--brand-primary)]/10 shrink-0 group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                      {rem.mascota?.imagen ? <img src={`http://localhost:3000/uploads/${rem.mascota.imagen}`} alt="Pet" className="w-full h-full object-cover" /> : <span className="group-hover:rotate-12 transition-transform scale-90">{rem.mascota?.tipo === 'Perro' ? '🐶' : rem.mascota?.tipo === 'Gato' ? '🐱' : '🐾'}</span>}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="font-black text-[var(--brand-text)] text-sm leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">{rem.titulo}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {rem.idEventoGoogle && <GoogleCalendarBrandIcon />}
                          <span className="text-[var(--brand-primary)] font-black text-[7px] uppercase tracking-tighter opacity-60">{new Date(rem.fechaHora).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <p className="text-[8px] font-bold text-[var(--brand-primary)]/50 uppercase tracking-widest italic">{rem.mascota?.nombre}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--brand-primary)]/20 rounded-[2.5rem] bg-[var(--brand-surface)]/30 backdrop-blur-sm flex-1 py-4 shrink-0">
                  <div className="text-4xl opacity-20 filter grayscale drop-shadow-lg">🐾</div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-black text-[var(--brand-text)] opacity-40 text-sm tracking-tight italic">{t('cal_no_activities')}</p>
                    <p className="text-[var(--brand-secondary)] text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{t('cal_lets_play')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-1 pt-2 shrink-0">
              <button 
                onClick={() => { setEditingReminder(null); setIsAddModalOpen(true); }}
                className="w-full py-2.5 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 group active:translate-y-0.5 border-b-4 border-black/10"
              >
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                  <span className="text-lg leading-none">+</span>
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
    </section>
  );
}
