import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon, GoogleCalendarBrandIcon } from '../common/Icons';
import AddReminderModal from '../layout/AddReminderModal';

export default function CalendarView({ activePet, pets, onRefreshRemindersGlobal }) {
  const [currentDate, setCurrentMonth] = useState(new Date());
  const today = new Date();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch("/api/recordatorios", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReminders(data);
        if (onRefreshRemindersGlobal) onRefreshRemindersGlobal();
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

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
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

  const handleEditReminder = (rem) => {
    setEditingReminder(rem);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingReminder(null);
  };

  return (
    <section className="h-full w-full max-w-5xl mx-auto flex flex-col px-4 pt-0 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden text-left">
      <header className="mb-3 flex justify-between items-center px-6 shrink-0 relative z-[20]">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] tracking-tighter italic text-left">Calendario</h2>
          <p className="text-[#bcedea] font-black text-[9px] uppercase tracking-[0.3em] mt-0.5 ml-1 opacity-80 italic">Plan de Bienestar</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#2d9b96]/30 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowLeftIcon /></button>
          <div className="bg-[#f0fdfa] px-4 py-1.5 rounded-full shadow-inner border border-[#3aaba5]/20 min-w-[130px]">
            <p className="text-[#2d9b96] font-black text-[9px] uppercase tracking-[0.2em] text-center italic">{monthNames[currentMonth]} <span className="opacity-40">{currentYear}</span></p>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 border border-white/10"><ArrowRightIcon /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 max-h-[100%] overflow-visible relative z-[10] pb-2">
        <div className="lg:col-span-7 bg-[#f0fdfa]/95 backdrop-blur-md rounded-[2.5rem] p-5 border-4 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col h-full animate-in zoom-in-95 duration-500 relative overflow-hidden min-h-0">
          <div className="grid grid-cols-7 gap-1.5 mb-4 mt-1 shrink-0 px-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, index) => (
              <div key={index} className="text-center text-[#2d9b96] font-black text-[9px] opacity-40 uppercase tracking-[0.1em] italic">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 flex-1 content-start overflow-visible text-left min-h-0 px-1">
            {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
            {days.map(d => {
              const dateObj = new Date(currentYear, currentMonth, d);
              const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const isSelected = d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
              const hasReminders = reminders.some(r => {
                const rDate = new Date(r.fechaHora);
                return rDate.getDate() === d && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
              });
              return (
                <button key={d} onClick={() => setSelectedDate(dateObj)} className={`aspect-[1.1/1] w-full rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-xs font-black m-0.5 ${isSelected ? 'bg-gradient-to-br from-[#5fc4b8] to-[#2d9b96] text-white shadow-lg scale-105 z-10 border-2 border-white' : isToday ? 'bg-[#bcedea] text-[#1a5d5a] ring-1 ring-[#2d9b96]/30 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-[#2d9b96] hover:scale-105 bg-[#bcedea]/10 border border-[#2d9b96]/10'}`}>
                  {d}
                  {hasReminders && <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#2d9b96]'} ${isSelected ? '' : 'animate-pulse'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 h-full min-h-0 overflow-hidden">
          <div className="bg-[#bcedea]/50 backdrop-blur-sm rounded-[2.5rem] p-5 border-4 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col h-full border-dashed border-[#3aaba5]/30 overflow-hidden px-4 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0 px-1">
               <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-full bg-white shadow-sm border border-[#bcedea] scale-90"><ClockIcon /></div>
                <h3 className="text-xl font-black text-gray-800 tracking-tighter italic text-left">Eventos</h3>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-full border border-[#2d9b96]/10 shadow-sm backdrop-blur-sm">
                <p className="text-[8px] font-black text-[#2d9b96] uppercase tracking-tighter italic">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5 pb-4 px-1 overflow-x-visible min-h-0">
              {selectedDayReminders.length > 0 ? (
                selectedDayReminders.map(rem => (
                  <div key={rem.id} onClick={() => handleEditReminder(rem)} className="bg-white/80 backdrop-blur-sm p-3 rounded-[1.8rem] border border-[#bcedea]/40 flex items-center gap-3.5 transition-all duration-300 group shadow-sm hover:shadow-[inset_0_0_0_2px_rgba(45,155,150,0.2)] hover:bg-white cursor-pointer relative shrink-0">
                    <div className="w-9 h-9 bg-[#f0fdfa] rounded-[1.1rem] flex items-center justify-center overflow-hidden text-lg shadow-inner border border-[#bcedea] shrink-0 group-hover:bg-[#bcedea]/20 transition-colors">
                      {rem.mascota?.imagen ? <img src={`http://localhost:3000/uploads/${rem.mascota.imagen}`} alt="Pet" className="w-full h-full object-cover" /> : <span className="group-hover:rotate-12 transition-transform scale-90">{rem.mascota?.tipo === 'Perro' ? '🐶' : rem.mascota?.tipo === 'Gato' ? '🐱' : '🐾'}</span>}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="font-black text-gray-800 text-sm leading-tight truncate group-hover:text-[#2d9b96] transition-colors">{rem.titulo}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {rem.idEventoGoogle && <GoogleCalendarBrandIcon />}
                          <span className="text-[#2d9b96] font-black text-[7px] uppercase tracking-tighter opacity-60">{new Date(rem.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <p className="text-[8px] font-bold text-[#2d9b96]/50 uppercase tracking-widest italic">{rem.mascota?.nombre}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#bcedea]/40 rounded-[2.5rem] bg-white/30 backdrop-blur-sm flex-1 py-4 shrink-0">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-md border border-[#bcedea]/40 animate-float-gentle">🦴</div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-black text-gray-400 text-sm tracking-tight italic">Sin pendientes</p>
                    <p className="text-[#3aaba5] text-[7px] font-black uppercase tracking-[0.2em] opacity-40">¡A jugar!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-1 pt-2 shrink-0">
              <button 
                onClick={() => { setEditingReminder(null); setIsAddModalOpen(true); }}
                className="w-full py-2.5 bg-gradient-to-r from-[#5fc4b8] to-[#2d9b96] text-white font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 group active:translate-y-0.5 border-b-4 border-black/10"
              >
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                  <span className="text-lg leading-none">+</span>
                </div>
                <span className="text-xs uppercase tracking-[0.1em] italic">Agendar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddReminderModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        pets={pets}
        onRefreshReminders={fetchReminders}
        initialDate={selectedDate}
        editReminder={editingReminder}
        activePetId={activePet?.id}
      />
    </section>
  );
}
