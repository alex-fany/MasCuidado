import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, CheckIcon, StarIcon, ShieldIcon, CalendarIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';

export default function AchievementsView({ user, pets, reminders }) {
  const { t, language } = useSettings();
  
  // Lógica de las misiones
  const missions = useMemo(() => [
    {
      id: 1,
      title: language === 'en' ? "First Friend" : language === 'pt' ? "Primeiro Amigo" : "Primer Amigo",
      desc: language === 'en' ? "Register your first pet in the system." : language === 'pt' ? "Registre seu primeiro pet no sistema." : "Registra tu primera mascota en el sistema.",
      completed: pets.length > 0,
      reward: language === 'en' ? "Initiator" : language === 'pt' ? "Iniciador" : "Iniciador",
      icon: "🐾"
    },
    {
      id: 2,
      title: language === 'en' ? "Elite Profile" : language === 'pt' ? "Perfil de Elite" : "Perfil de Élite",
      desc: language === 'en' ? "Complete your name and visual identity." : language === 'pt' ? "Complete seu nome e identidade visual." : "Completa tu nombre e identidad visual.",
      completed: !!(user?.nombreCompleto || user?.nombre_completo) && !!user?.imagen,
      reward: language === 'en' ? "Top Citizen" : language === 'pt' ? "Cidadão Exemplar" : "Ciudadano Ejemplar",
      icon: "👤"
    },
    {
      id: 3,
      title: language === 'en' ? "Expert Organizer" : language === 'pt' ? "Organizador Especialista" : "Organizador Experto",
      desc: language === 'en' ? "Create at least 3 reminders for your pets." : language === 'pt' ? "Crie pelo menos 3 lembretes para seus pets." : "Crea al menos 3 recordatorios para tus mascotas.",
      completed: reminders.length >= 3,
      reward: language === 'en' ? "Golden Agenda" : language === 'pt' ? "Agenda de Ouro" : "Agenda de Oro",
      icon: "📅"
    },
    {
      id: 4,
      title: language === 'en' ? "Large Pack" : language === 'pt' ? "Matilha Numerosa" : "Manada Numerosa",
      desc: language === 'en' ? "Register 3 or more companions." : language === 'pt' ? "Registre 3 ou mais companheiros." : "Registra a 3 o más compañeros.",
      completed: pets.length >= 3,
      reward: language === 'en' ? "Pack Leader" : language === 'pt' ? "Líder de Matilha" : "Líder de Manada",
      icon: "🐕"
    },
    {
      id: 5,
      title: language === 'en' ? "Security First" : language === 'pt' ? "Segurança Primeiro" : "Seguridad Primero",
      desc: language === 'en' ? "Link your account with Google Calendar." : language === 'pt' ? "Vincule sua conta ao Google Calendar." : "Vincula tu cuenta con Google Calendar.",
      completed: !!user?.googleId,
      reward: language === 'en' ? "Digital Partner" : language === 'pt' ? "Sócio Digital" : "Socio Digital",
      icon: "🔐"
    }
  ], [user, pets, reminders, language]);

  const completedCount = missions.filter(m => m.completed).length;
  const progress = (completedCount / missions.length) * 100;
  const level = Math.floor(completedCount * 1.5) + 1;

  const CardWrapper = ({ children, className = "" }) => (
    <div 
      className={`rounded-[2.5rem] border-4 border-[var(--brand-border-strong)] shadow-xl overflow-hidden flex flex-col ${className}`}
      style={{ background: 'var(--brand-modal-gradient)' }}
    >
      {children}
    </div>
  );

  return (
    <section className="h-full w-full max-w-[1400px] mx-auto flex flex-col px-6 pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden text-left">
      
      {/* Header */}
      <header className="mb-6 flex justify-between items-end px-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-xl rotate-3">
            <TrophyIcon />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white drop-shadow-md tracking-tighter italic leading-none text-left">{language === 'en' ? 'Achievements & Missions' : language === 'pt' ? 'Conquistas e Missões' : 'Logros y Misiones'}</h2>
            <p className="text-[var(--brand-accent)] font-black text-[10px] uppercase tracking-[0.3em] mt-1 opacity-90 italic text-left">{language === 'en' ? 'Road to care excellence' : language === 'pt' ? 'Caminho para a excelência no cuidado' : 'Camino a la excelencia en cuidado'}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{language === 'en' ? 'Caregiver Level' : language === 'pt' ? 'Nível de Cuidador' : 'Nivel de Cuidador'}</span>
             <span className="text-4xl font-black text-[var(--brand-primary)] italic leading-none drop-shadow-lg">{level}</span>
          </div>
          <div className="w-48 h-2 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)]"
             />
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Lado Izquierdo: Resumen de Progreso */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          <CardWrapper className="flex-1 p-8 justify-center items-center text-center">
            <div className="w-40 h-40 rounded-full border-[12px] border-[var(--brand-primary)]/10 flex items-center justify-center relative mb-6 shadow-inner">
               <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-[var(--brand-primary)] rotate-45"></div>
               <div className="text-6xl animate-bounce-gentle">🏆</div>
            </div>
            <h3 className="text-2xl font-black text-[var(--brand-primary)] italic tracking-tight mb-2">{language === 'en' ? 'Great job,' : language === 'pt' ? 'Bom trabalho,' : '¡Gran trabajo,'} {user?.nombreCompleto?.split(' ')[0]}!</h3>
            <p className="text-[var(--brand-text)] opacity-60 text-xs font-bold leading-relaxed px-4">
              {language === 'en' ? `You have completed ${completedCount} out of ${missions.length} main missions. Keep caring for your pack to unlock new badges.` : language === 'pt' ? `Você completou ${completedCount} de ${missions.length} missões principais. Continue cuidando de sua matilha para desbloquear novas medalhas.` : `Has completado ${completedCount} de ${missions.length} misiones principales. Sigue cuidando a tu manada para desbloquear nuevas insignias.`}
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full mt-8">
               <div className="bg-[var(--brand-surface-muted)] p-4 rounded-2xl border border-[var(--brand-primary)]/5">
                  <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase">{language === 'en' ? 'Missions' : language === 'pt' ? 'Missões' : 'Misiones'}</p>
                  <p className="text-xl font-black text-[var(--brand-text)]">{completedCount}/{missions.length}</p>
               </div>
               <div className="bg-[var(--brand-surface-muted)] p-4 rounded-2xl border border-[var(--brand-primary)]/5">
                  <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase">{language === 'en' ? 'Points' : language === 'pt' ? 'Pontos' : 'Puntos'}</p>
                  <p className="text-xl font-black text-orange-600">{completedCount * 150}</p>
               </div>
            </div>
          </CardWrapper>

          <CardWrapper className="p-6 bg-[var(--brand-primary)]/5 border-dashed border-[var(--brand-primary)]/20">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white"><StarIcon filled /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)]">{language === 'en' ? 'Level Benefits' : language === 'pt' ? 'Benefícios de Nível' : 'Beneficios de Nivel'}</h4>
             </div>
             <ul className="space-y-3">
                {[
                  language === 'en' ? "Increased visibility on map" : language === 'pt' ? "Maior visibilidade no mapa" : "Mayor visibilidad en el mapa",
                  language === 'en' ? "Priority reminders" : language === 'pt' ? "Lembretes prioritários" : "Recordatorios prioritarios",
                  language === 'en' ? "Verified Caregiver badge" : language === 'pt' ? "Medalha de Cuidador Verificado" : "Insignia de Cuidador Verificado"
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-[var(--brand-text)] opacity-70">
                    <span className="text-[var(--brand-primary)]">✦</span> {b}
                  </li>
                ))}
             </ul>
          </CardWrapper>
        </div>

        {/* Lado Derecho: Lista de Misiones */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <CardWrapper className="flex-1 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-[var(--brand-primary)]/10 pb-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-80 italic">{language === 'en' ? 'Active Missions' : language === 'pt' ? 'Missões Ativas' : 'Misiones Activas'}</h4>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
              {missions.map((m) => (
                <motion.div 
                  key={m.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-300 ${
                    m.completed 
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 shadow-md' 
                      : 'bg-[var(--brand-surface-muted)] border-transparent opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
                      m.completed ? 'bg-[var(--brand-primary)]/10' : 'bg-white/20'
                    }`}>
                      {m.icon}
                    </div>
                    <div className="text-left space-y-0.5">
                      <h5 className={`font-black text-base italic leading-tight ${m.completed ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-text)]'}`}>
                        {m.title}
                      </h5>
                      <p className="text-[10px] font-bold text-[var(--brand-text)] opacity-60 leading-relaxed max-w-md">
                        {m.desc}
                      </p>
                      {m.completed && (
                        <div className="inline-block mt-1 bg-orange-500/10 px-2 py-0.5 rounded text-[8px] font-black text-orange-600 uppercase tracking-tighter">
                          +{m.reward}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    m.completed 
                      ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg' 
                      : 'border-[var(--brand-text)]/10'
                  }`}>
                    {m.completed ? <CheckIcon /> : <span className="text-xs font-black opacity-20">?</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardWrapper>
        </div>

      </div>
    </section>
  );
}
