import React, { useState, useEffect } from 'react';
import { FoodBowlIcon, WaterDropIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';

export default function NutricionHub({ activePet, onClick, onWaterClick, refreshKey }) {
  const { t } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShaking, setIsShaking] = useState(false);

  const fetchEstado = async () => {
    if (!activePet) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/nutricion/${activePet.id}/estado`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Error al obtener estado nutricional:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, [activePet, refreshKey]);

  if (loading) return <div className="w-16 h-16 animate-pulse bg-white/10 rounded-full" />;

  const alimento = data?.alimento;
  const aguaHoy = typeof data?.agua?.hoy === 'number' ? data.agua.hoy : parseInt(data?.agua?.hoy || 0, 10);
  const aguaMeta = typeof data?.agua?.meta === 'number' ? data.agua.meta : parseInt(data?.agua?.meta || 4, 10);

  const handleWaterClickInternal = () => {
    if (aguaHoy >= aguaMeta) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onWaterClick();
  };

  return (
    <div className="flex flex-col items-center gap-6 group">
      {/* Botón Principal */}
      <div className="relative">
        {/* Barra de Progreso */}
        <svg className="absolute -inset-2 w-20 h-20 -rotate-90">
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-white/10"
          />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 36}
            strokeDashoffset={2 * Math.PI * 36 * (1 - (alimento?.porcentaje || 0) / 100)}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              alimento?.alerta ? 'text-red-500' : 'text-[var(--brand-primary)]'
            }`}
          />
        </svg>

        <button 
          onClick={onClick}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-[var(--brand-border-strong)] shadow-lg relative z-10 
            bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] hover:shadow-xl hover:scale-105 active:scale-95`}
          title={t('home_nutrition_hub')}
        >
          <div className="group-hover:rotate-12 transition-transform">
            <FoodBowlIcon />
          </div>

          {/* Badge de Alerta */}
          {alimento?.alerta && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[var(--brand-border-strong)] flex items-center justify-center animate-bounce">
              <span className="text-[8px] text-white">⚠️</span>
            </div>
          )}
        </button>

        {/* Info Rápida de Días */}
        {alimento && (
          <div className="absolute -bottom-1 -right-1 bg-[var(--brand-modal-bg)] px-2 py-0.5 rounded-full border border-[var(--brand-border)] shadow-sm z-20">
            <span className={`text-[8px] font-black italic tracking-tighter ${alimento.alerta ? 'text-red-500' : 'text-[var(--brand-primary)]'}`}>
              {alimento.diasRestantes}d
            </span>
          </div>
        )}
      </div>

      {/* Control Rápido de Agua */}
      <div className="flex flex-col items-center gap-2 h-10 relative">
        <button 
          onClick={handleWaterClickInternal}
          className={`w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center transition-all active:scale-90 hover:bg-white/20 relative group/water ${isShaking ? 'animate-shake' : ''}`}
        >
          <div className={`group-hover/water:scale-110 transition-transform`}>
            <WaterDropIcon />
          </div>
          <div className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white/20">
            +
          </div>
        </button>
      </div>

      {/* Indicador de Gotas */}
      <div className="flex gap-1">
        {[...Array(aguaMeta)].map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-2 rounded-full transition-all duration-500 ${
              i < aguaHoy ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'bg-black/10 dark:bg-white/10'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
