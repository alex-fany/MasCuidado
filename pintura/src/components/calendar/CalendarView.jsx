import { useState } from 'react';
import { CalendarIcon, ClockIcon } from '../common/Icons';

export default function CalendarView({ reminders, activePet }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();

  // Calendario simulado
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Filtrar recordatorios para el día seleccionado (También simulado pq no sirve el google)
  const selectedDayReminders = reminders.filter(r => r.petId === activePet.id);

  return (
    <section className="flex-1 w-full max-w-4xl mx-auto flex flex-col px-4 pt-0 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera */}
      <header className="mb-6 flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(45,155,150,0.4)] tracking-tight">
            Calendario
          </h2>
          <p className="text-[#3aaba5] font-bold text-sm tracking-widest uppercase">
            {monthNames[currentMonth]} {currentYear}
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 text-white shadow-xl animate-bounce-gentle">
            <CalendarIcon />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 items-start">
        {/* Lado Izquierdo: El Calendario */}
        <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-8 border-4 border-white shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-7 mb-6">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
              <div key={d} className="text-center text-[#2d9b96] font-black text-xs opacity-40 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
            {days.map(d => {
              const isToday = d === today.getDate();
              const hasReminder = d === 15 || d === 16 || d === 20; // Mock visual
              
              return (
                <button 
                  key={d}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, d))}
                  className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 font-black text-sm
                    ${isToday ? 'bg-[#2d9b96] text-white shadow-lg scale-110 z-10 border-4 border-white' : 'hover:bg-[#bcedea] text-[#1a5d5a] bg-white/40'}
                    ${hasReminder && !isToday ? 'ring-2 ring-dashed ring-[#3aaba5]/40' : ''}
                  `}
                >
                  {d}
                  {hasReminder && (
                    <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-[#3aaba5]'} animate-pulse`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Recordatorios del día */}
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-[#f0fdfa]/90 backdrop-blur-sm rounded-[3rem] p-8 border-4 border-white shadow-2xl flex-1 border-dashed border-[#3aaba5]/20">
            <h3 className="text-[#2d9b96] font-black text-2xl mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#bcedea] rounded-xl">
                <ClockIcon className="w-6 h-6" />
              </div>
              Actividades
            </h3>
            
            <div className="space-y-4">
              {selectedDayReminders.length > 0 ? (
                selectedDayReminders.map(rem => (
                  <div key={rem.id} className="bg-white p-5 rounded-[2rem] border-2 border-[#bcedea] flex items-center gap-5 hover:scale-[1.02] transition-all cursor-pointer shadow-md group">
                    <div className="w-14 h-14 bg-[#f0fdfa] rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-[#bcedea] transition-colors">
                      {activePet.realAvatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[#2d9b96] text-lg leading-tight group-hover:translate-x-1 transition-transform">{rem.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white bg-[#3aaba5] px-3 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">{rem.time}</span>
                        <span className="text-[#3aaba5] text-xs font-bold opacity-60 italic">{activePet.name}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-6 flex flex-col items-center gap-4 border-2 border-dashed border-[#2d9b96]/10 rounded-[2.5rem] bg-white/20">
                  <span className="text-5xl opacity-40">🦴</span>
                  <p className="font-black text-[#2d9b96] text-lg leading-tight opacity-50">¡Nada agendado por ahora!</p>
                  <p className="text-[#3aaba5] text-sm font-bold opacity-40">Disfruta el día con tu mascota</p>
                </div>
              )}
            </div>

            <button className="w-full mt-8 py-5 bg-[#2d9b96] text-white font-black rounded-3xl hover:bg-[#23807c] transition-all shadow-xl shadow-[#2d9b96]/20 flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 group">
                <span className="text-2xl leading-none group-hover:rotate-90 transition-transform">+</span> 
                AGENDAR RECORDATORIO
            </button>
          </div>
          
          {/* Tip */}
          {/* <div className="bg-[#bcedea]/40 p-6 rounded-[2rem] border-2 border-white/50 flex items-center gap-4">
             <div className="text-3xl animate-bounce-gentle">💡</div>
             <p className="text-[#1a5d5a] text-sm font-bold italic leading-tight">
               "Mantener una rutina de paseos ayuda a reducir el estrés de {activePet.name}."
             </p>
          </div> */}
        </div>
      </div>
    </section>
  );
}
