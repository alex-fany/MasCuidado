import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, CheckIcon, StarIcon, ShieldIcon, CalendarIcon, FoodBowlIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';

// Fondo
const FloatingOrb = ({ color, size, duration, delay }) => (
  <motion.div
    animate={{
      y: [0, -40, 0],
      x: [0, 20, 0],
      scale: [1, 1.1, 1],
      opacity: [0.05, 0.1, 0.05]
    }}
    transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(30px)',
      zIndex: 0,
      pointerEvents: 'none'
    }}
  />
);

export default function AchievementsView({ user, pets, reminders }) {
  const { t, language } = useSettings();
  const [displayXP, setDisplayXP] = useState(0);

  // Utilidad interna para lógica de peso
  const factor = { 'g': 1, 'kg': 1000, 'oz': 28.3495, 'lb': 453.592, 't': 1000000 };

  const achievements = useMemo(() => [
    // Fundamentos
    {
      id: 1, tier: 'bronze', category: 'essentials',
      title: { es: "Primer Amigo", en: "First Friend", pt: "Primeiro Amigo" },
      desc: { es: "Registra tu primera mascota.", en: "Register your first pet.", pt: "Registre seu primeiro pet." },
      completed: pets.length > 0, icon: "🐾", points: 100, color: "from-orange-400 to-orange-700"
    },
    {
      id: 2, tier: 'silver', category: 'essentials',
      title: { es: "Líder de Manada", en: "Pack Leader", pt: "Líder da Matilha" },
      desc: { es: "Gestiona a 3 o más mascotas.", en: "Manage 3 or more pets.", pt: "Gerencie 3 ou mais animais." },
      completed: pets.length >= 3, icon: "🐕", points: 250, color: "from-slate-300 to-slate-500"
    },
    {
      id: 3, tier: 'bronze', category: 'essentials',
      title: { es: "Perfil Pro", en: "Pro Profile", pt: "Perfil Pro" },
      desc: { es: "Completa tu nombre e identidad visual.", en: "Complete your name and avatar.", pt: "Complete seu nome e avatar." },
      completed: !!user?.nombreCompleto && !!user?.imagen, icon: "👤", points: 150, color: "from-orange-400 to-orange-700"
    },
    {
      id: 4, tier: 'bronze', category: 'essentials',
      title: { es: "Sincronizado", en: "Synced", pt: "Sincronizado" },
      desc: { es: "Vincula tu cuenta con Google Calendar.", en: "Link your account with Google.", pt: "Vincule sua conta ao Google." },
      completed: !!user?.googleId, icon: "☁️", points: 200, color: "from-orange-400 to-orange-700"
    },

    // Salud
    {
      id: 5, tier: 'bronze', category: 'health',
      title: { es: "Escudo Salud", en: "Health Shield", pt: "Escudo Saúde" },
      desc: { es: "Registra la primera vacuna.", en: "Register your first vaccine.", pt: "Registre sua primeira vacina." },
      completed: pets.some(p => p.vacunas?.length > 0), icon: "💉", points: 150, color: "from-orange-400 to-orange-700"
    },
    {
      id: 6, tier: 'bronze', category: 'health',
      title: { es: "Bibliotecario", en: "Librarian", pt: "Bibliotecário" },
      desc: { es: "Sube una foto de cartilla física.", en: "Upload a physical record photo.", pt: "Envie uma foto da caderneta." },
      completed: pets.some(p => p.fotosCartilla && JSON.parse(JSON.stringify(p.fotosCartilla)).length > 0), icon: "📸", points: 150, color: "from-orange-400 to-orange-700"
    },
    {
      id: 7, tier: 'silver', category: 'health',
      title: { es: "Héroe Clínico", en: "Clinical Hero", pt: "Herói Clínico" },
      desc: { es: "Registra 3 o más vacunas para una mascota.", en: "Register 3+ vaccines for a pet.", pt: "Registre 3+ vacinas para um pet." },
      completed: pets.some(p => p.vacunas?.length >= 3), icon: "🩺", points: 300, color: "from-slate-300 to-slate-500"
    },
    {
      id: 8, tier: 'silver', category: 'health',
      title: { es: "Protector", en: "Protector", pt: "Protetor" },
      desc: { es: "Agenda un refuerzo futuro de vacuna.", en: "Set a future booster dose.", pt: "Agende um reforço de vacina." },
      completed: pets.some(p => p.vacunas?.some(v => !!v.proximaDosis)), icon: "🛡️", points: 250, color: "from-slate-300 to-slate-500"
    },

    // Nutrición
    {
      id: 9, tier: 'bronze', category: 'nutrition',
      title: { es: "Proveedor", en: "Provider", pt: "Fornecedor" },
      desc: { es: "Registra tu primera compra de alimento.", en: "Register your first food purchase.", pt: "Registre sua primeira compra." },
      completed: pets.some(p => p.inventariosAlimento?.length > 0), icon: "🥣", points: 150, color: "from-orange-400 to-orange-700"
    },
    {
      id: 10, tier: 'silver', category: 'nutrition',
      title: { es: "Socio del Cuenco", en: "Bowl Partner", pt: "Sócio da Tigela" },
      desc: { es: "Crea un grupo de comida compartida.", en: "Create a shared food group.", pt: "Crie um grupo de comida compartilhada." },
      completed: pets.some(p => p.inventariosAlimento?.some(i => i.compartidoCon?.length > 0)), icon: "🤝", points: 350, color: "from-slate-300 to-slate-500"
    },
    {
      id: 11, tier: 'silver', category: 'nutrition',
      title: { es: "Reserva Maestro", en: "Master Reserve", pt: "Reserva Mestre" },
      desc: { es: "Asegura el suministro: registra una compra de 10kg o más.", en: "Secure supply: register a purchase of 10kg or more.", pt: "Garanta o suprimento: registre uma compra de 10kg ou mais." },
      completed: pets.some(p => p.inventariosAlimento?.some(i => (i.cantidadTotal * (factor[i.unidadMedida] || 1)) >= 10000)), icon: "📦", points: 200, color: "from-slate-300 to-slate-500"
    },
    {
      id: 12, tier: 'silver', category: 'nutrition',
      title: { es: "Hidratación", en: "Hydration", pt: "Hidratação" },
      desc: { es: "Establece una meta de agua diaria.", en: "Set a daily water goal.", pt: "Defina uma meta de água." },
      completed: pets.some(p => p.nutricionConfig?.metaAguaDiaria > 0), icon: "💧", points: 200, color: "from-slate-300 to-slate-500"
    },

    // Maestría
    {
      id: 13, tier: 'gold', category: 'mastery',
      title: { es: "Expediente Oro", en: "Golden Record", pt: "Prontuário Ouro" },
      desc: { es: "Completa todos los datos médicos.", en: "Complete all medical fields.", pt: "Complete os dados médicos." },
      completed: pets.some(p => p.raza && p.edad && p.peso && p.padecimientos && p.medicamentos), icon: "📜", points: 500, color: "from-amber-300 to-amber-600"
    },
    {
      id: 14, tier: 'silver', category: 'mastery',
      title: { es: "Explorador", en: "Scout", pt: "Explorador" },
      desc: { es: "Guarda una clínica favorita en el mapa.", en: "Save a favorite clinic on the map.", pt: "Salve uma clínica favorita." },
      completed: pets.some(p => p.clinicasFavoritas?.length > 0), icon: "🏥", points: 250, color: "from-slate-300 to-slate-500"
    },
    {
      id: 15, tier: 'silver', category: 'mastery',
      title: { es: "Agenda Maestra", en: "Master Agenda", pt: "Agenda Mestra" },
      desc: { es: "Mantén 5 recordatorios activos.", en: "Keep 5 active reminders.", pt: "Mantenha 5 lembretes ativos." },
      completed: reminders.length >= 5, icon: "📅", points: 300, color: "from-slate-300 to-slate-500"
    },
    {
      id: 16, tier: 'gold', category: 'mastery',
      title: { es: "Planificador", en: "Planner", pt: "Planejador" },
      desc: { es: "Sincroniza 5 eventos con Google.", en: "Sync 5 events with Google.", pt: "Sincronize 5 eventos no Google." },
      completed: reminders.filter(r => !!r.idEventoGoogle).length >= 5, icon: "⚡", points: 450, color: "from-amber-300 to-amber-600"
    }
  ], [user, pets, reminders]);

  const categories = [
    { id: 'essentials', name: { es: 'Fundamentos', en: 'Essentials', pt: 'Fundamentos' }, icon: <StarIcon /> },
    { id: 'health', name: { es: 'Salud', en: 'Health', pt: 'Saúde' }, icon: <ShieldIcon /> },
    { id: 'nutrition', name: { es: 'Nutrición', en: 'Nutrition', pt: 'Nutrição' }, icon: <FoodBowlIcon /> },
    { id: 'mastery', name: { es: 'Maestría', en: 'Mastery', pt: 'Maestria' }, icon: <TrophyIcon /> }
  ];

  const completedCount = achievements.filter(a => a.completed).length;
  const totalPoints = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.points, 0);
  const progress = (completedCount / achievements.length) * 100;

  useEffect(() => {
     let start = 0;
     const end = totalPoints;
     const timer = setInterval(() => {
       start += Math.ceil(end / 30);
       if (start >= end) { setDisplayXP(end); clearInterval(timer); }
       else setDisplayXP(start);
     }, 30);
     return () => clearInterval(timer);
  }, [totalPoints]);
  
  const currentRank = useMemo(() => {
    if (progress >= 90) return { name: { es: "Protector Legendario", en: "Legendary Protector", pt: "Protetor Lendário" }, color: "from-amber-400 to-orange-600", glow: "shadow-amber-500/40", icon: "👑" };
    if (progress >= 60) return { name: { es: "Cuidador Élite", en: "Elite Caregiver", pt: "Cuidador Elite" }, color: "from-emerald-400 to-teal-600", glow: "shadow-emerald-500/40", icon: "💎" };
    if (progress >= 30) return { name: { es: "Cuidador Experto", en: "Expert Caregiver", pt: "Cuidador Experto" }, color: "from-blue-400 to-indigo-600", glow: "shadow-blue-500/40", icon: "🎖️" };
    return { name: { es: "Iniciado", en: "Novice", pt: "Iniciado" }, color: "from-purple-400 to-pink-600", glow: "shadow-purple-500/40", icon: "🐾" };
  }, [progress]);

  return (
    <section className="h-full w-full max-w-[1600px] mx-auto flex flex-col px-10 pt-0 pb-14 animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-hidden relative text-left">
      <FloatingOrb color="var(--brand-primary)" size={300} duration={20} delay={0} />
      <FloatingOrb color="#f59e0b" size={200} duration={25} delay={2} />

      <header className="mb-4 p-5 bg-black/20 backdrop-blur-2xl rounded-[2.5rem] border-2 border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 relative z-10 overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <motion.div whileHover={{ rotate: 10, scale: 1.05 }} className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentRank.color} flex items-center justify-center text-3xl shadow-xl ${currentRank.glow} relative`}>
             <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse"></div>
             {currentRank.icon}
          </motion.div>
          <div className="text-left">
            <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase tracking-[0.4em] mb-1 italic opacity-80">{language === 'en' ? 'Honor Status' : 'Estado de Honor'}</p>
            <h2 className="text-2xl font-black text-white tracking-tighter italic leading-none">{currentRank.name[language] || currentRank.name.es} <span className="text-xs not-italic opacity-20 font-light ml-2">Lvl.{Math.floor(progress/10) + 1}</span></h2>
            <div className="flex items-center gap-3 mt-3">
               <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/5"><span className="text-amber-500 font-black text-[9px] italic uppercase tracking-widest">{displayXP} XP</span></div>
               <span className="text-[8px] font-black text-white/30 uppercase tracking-widest italic border-l border-white/10 pl-3">{completedCount}/{achievements.length} {language === 'en' ? 'Unlocked' : 'Desbloqueados'}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-lg w-full flex flex-col gap-2 relative z-10">
           <div className="flex justify-between items-end mb-0.5 px-1"><span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">{language === 'en' ? 'Journey Progress' : 'Senda de Maestría'}</span><span className="text-lg font-black text-white italic tracking-widest">{Math.round(progress)}%</span></div>
           <div className="h-3 bg-black/60 rounded-full overflow-hidden border-2 border-white/5 shadow-inner p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: "circOut" }} className={`h-full rounded-full bg-gradient-to-r ${currentRank.color} relative shadow-[0_0_15px_rgba(255,255,255,0.2)]`} /></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8 pb-12 relative z-10 no-scrollbar">
        {categories.map((cat, catIdx) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: catIdx * 0.05 }} className="space-y-6">
            <div className="flex items-center gap-4 border-l-4 border-[var(--brand-primary)] pl-4">
               <div className="text-[var(--brand-primary)] opacity-50 scale-90">{cat.icon}</div>
               <h3 className="text-lg font-black text-white/80 italic tracking-tight uppercase leading-none">{cat.name[language] || cat.name.es}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
               {achievements.filter(a => a.category === cat.id).map((a) => (
                  <motion.div key={a.id} whileHover={{ y: -5, scale: 1.02 }} className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center text-center group overflow-hidden ${a.completed ? 'bg-white/[0.04] border-white/10 shadow-xl backdrop-blur-sm' : 'bg-black/30 border-transparent opacity-45 grayscale-[80%]'}`}>
                    {a.completed && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />}
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl mb-5 relative transition-all duration-700 ${a.completed ? `bg-gradient-to-br ${a.color} shadow-lg` : 'bg-white/5'}`}>
                       {a.completed && <div className={`absolute inset-0 rounded-[1.5rem] blur-xl opacity-30 bg-gradient-to-br ${a.color}`}></div>}
                       <span className="relative z-10 group-hover:scale-110 transition-transform duration-500">{a.icon}</span>
                    </div>
                    <h4 className={`text-base font-black italic tracking-tight mb-2 ${a.completed ? 'text-white' : 'text-white/60'}`}>{a.title[language] || a.title.es}</h4>
                    <p className={`text-xs font-bold leading-relaxed px-2 mb-5 line-clamp-3 ${a.completed ? 'text-white/60' : 'text-white/40'}`}>{a.desc[language] || a.desc.es}</p>
                    <div className="mt-auto w-full flex items-center justify-between pt-4 border-t border-white/5">
                       <span className={`text-[10px] font-black italic ${a.completed ? 'text-[var(--brand-primary)]' : 'text-white/20'}`}>+{a.points} XP</span>
                       {a.completed && <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg border border-white/10"><CheckIcon /></div>}
                    </div>
                    <div className={`absolute top-4 right-5 text-[7px] font-black uppercase tracking-widest opacity-20 italic ${a.tier === 'gold' ? 'text-amber-400' : a.tier === 'silver' ? 'text-slate-300' : 'text-orange-500'}`}>{t(`tier_${a.tier}`)}</div>
                    </motion.div>
               ))}
            </div>
          </motion.div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes shimmer { 0% { transform: translateX(-200%) rotate(45deg); } 100% { transform: translateX(200%) rotate(45deg); } } .animate-shimmer { animation: shimmer 6s infinite linear; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }` }} />
    </section>
  );
}
