import React, { useState, useEffect } from 'react';
import { CloseIcon, FoodBowlIcon, CheckIcon, UsersIcon } from '../common/Icons';
import Input from '../Input';
import { useSettings } from '../../context/SettingsContext';

export default function NutricionModal({ isOpen, onClose, pet, onSave }) {
  const { t } = useSettings();
  const [activeTab, setActivePetTab] = useState('config');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [allPets, setAllPets] = useState([]);
  const [data, setData] = useState({
    porcionDiaria: 0,
    unidadMedida: 'g',
    metaAguaDiaria: 4,
    reinicioAguaDias: 1,
    vaciarAgua: false,
    vaciarComida: false,
    marca: '',
    tipo: 'Croquetas',
    cantidadTotal: 0,
    compraUnidad: 'kg',
    costo: '',
    modoCompra: 'add',
    compartidaConIds: []
  });
  const [alimentoStatus, setAlimentoStatus] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  const UNIDADES = ['g', 'kg', 'oz', 'lb', 't'];

  useEffect(() => {
    if (isOpen && pet) {
      setConflictData(null);
      fetchConfig();
      fetchAllPets();
    }
  }, [isOpen, pet]);

  const handleCloseInternal = () => {
    setConflictData(null);
    setSuccess(false);
    onClose();
  };

  const fetchAllPets = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/mascotas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAllPets(result.filter(p => p.id !== pet.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/nutricion/${pet.id}/estado`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAlimentoStatus(result.alimento);
        setData(prev => ({
          ...prev,
          porcionDiaria: result.config?.porcionDiaria || 0,
          unidadMedida: result.config?.unidadMedida || 'g',
          metaAguaDiaria: result.config?.metaAguaDiaria || 4,
          reinicioAguaDias: result.config?.reinicioAguaDias || 1,
          vaciarAgua: false,
          vaciarComida: false,
          marca: '',
          cantidadTotal: 0,
          compraUnidad: result.alimento?.totalUnidad || 'kg',
          modoCompra: 'add',
          compartidaConIds: result.alimento?.grupoIds || []
        }));
      }
    } catch (err) {
      console.error("Error al cargar config nutrición:", err);
    }
  };

  const handleSaveConfig = async (resolveConflict = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Limpiezas manuales
      if (data.vaciarComida) {
          await fetch(`/api/nutricion/${pet.id}/compartir/active`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
      }

      // Guardar configuración básica
      await fetch(`/api/nutricion/${pet.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          porcionDiaria: parseFloat(data.porcionDiaria),
          metaAguaDiaria: parseInt(data.metaAguaDiaria),
          reinicioAguaDias: parseInt(data.reinicioAguaDias),
          unidadMedida: data.unidadMedida,
          vaciarAgua: data.vaciarAgua
        })
      });

      // Sincronizar el grupo si no vaciamos la comida
      if (!data.vaciarComida) {
          const resGrp = await fetch(`/api/nutricion/${pet.id}/compartir`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
                compartidaConIds: data.compartidaConIds,
                resolveConflict 
            })
          });

          if (resGrp.status === 409) {
              const conflict = await resGrp.json();
              setConflictData({ ...conflict, context: 'config' });
              setLoading(false);
              return;
          }
      }

      setSuccess(true);
      setTimeout(() => { 
        handleCloseInternal();
        onSave();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBuy = async (resolveConflict = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/nutricion/${pet.id}/compra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          marca: data.marca,
          tipo: data.tipo,
          cantidadTotal: parseFloat(data.cantidadTotal),
          unidadMedida: data.compraUnidad,
          costo: data.costo ? parseFloat(data.costo) : null,
          modoCompra: 'add',
          compartidaConIds: data.compartidaConIds,
          resolveConflict
        })
      });

      if (res.status === 409) {
          const conflict = await res.json();
          setConflictData({ ...conflict, context: 'buy' });
          setLoading(false);
          return;
      }

      if (res.ok) {
        setSuccess(true);
        setConflictData(null);
        setTimeout(() => { handleCloseInternal(); onSave(); }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/nutricion/${pet.id}/compartir/active`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchConfig();
        onSave();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectStyle = "w-full h-[52px] bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-2xl text-[var(--brand-text)] font-black text-xs outline-none p-3 shadow-inner appearance-none cursor-pointer dark:bg-black/20 text-left";
  const optionStyle = "bg-[var(--brand-modal-bg)] text-[var(--brand-text)]";

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border-4 border-[var(--brand-primary)]/20 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {!conflictData && !success && (
          <>
            <div className="flex justify-between items-start mb-6 text-left shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                   <FoodBowlIcon />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-[var(--brand-primary)] italic tracking-tighter leading-none">{t('nutri_title')}</h2>
                    <p className="text-[9px] font-black text-[var(--brand-text)] opacity-40 uppercase tracking-widest mt-1">{pet.nombre}</p>
                 </div>
              </div>
              <button onClick={handleCloseInternal} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="flex gap-2 p-1.5 bg-[var(--brand-surface-muted)] rounded-2xl mb-8 shrink-0">
                <button 
                    onClick={() => setActivePetTab('config')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'text-[var(--brand-text)] opacity-40 hover:opacity-100'}`}
                >
                    {t('nutri_config')}
                </button>
                <button 
                    onClick={() => setActivePetTab('compra')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'compra' ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'text-[var(--brand-text)] opacity-40 hover:opacity-100'}`}
                >
                    {t('nutri_register_buy')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'config' ? (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {alimentoStatus ? (
                          <div className="bg-[var(--brand-surface-muted)] p-5 rounded-3xl border-2 border-[var(--brand-primary)]/10 text-left">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase text-[var(--brand-primary)]">{alimentoStatus.marca || t('nutri_active_food')}</span>
                                <span className="text-[9px] font-black bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded-full uppercase tracking-tighter">{alimentoStatus.diasRestantes} {t('nutri_days_left')}</span>
                             </div>
                             <div className="flex items-end gap-1">
                                <span className="text-2xl font-black text-[var(--brand-text)] italic tracking-tighter">{Math.round(alimentoStatus.cantidadRestante)}</span>
                                <span className="text-xs font-black text-[var(--brand-text)] opacity-40 uppercase mb-1">{t(`unit_${alimentoStatus.totalUnidad}`)}</span>
                                <div className="ml-auto w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                                   <div className={`h-full transition-all duration-1000 ${alimentoStatus.alerta ? 'bg-red-500' : 'bg-[var(--brand-primary)]'}`} style={{ width: `${alimentoStatus.porcentaje}%` }} />
                                </div>
                             </div>
                          </div>
                        ) : (
                            <div className="bg-orange-500/5 border-2 border-orange-500/10 p-6 rounded-3xl text-center">
                                <p className="text-[10px] font-black uppercase text-orange-600 mb-1">{t('nutri_no_food')}</p>
                                <p className="text-[8px] font-bold text-[var(--brand-text)] opacity-40 uppercase">{t('nutri_no_food_desc')}</p>
                            </div>
                        )}

                        <div className="flex gap-4 items-end text-left">
                          <div className="flex-1">
                            <Input 
                                label={t('nutri_daily_portion')}
                                type="number"
                                min={0}
                                value={data.porcionDiaria}
                                onChange={(e) => setData({...data, porcionDiaria: e.target.value})}
                                placeholder="Ej: 300"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70 mb-1.5 block">{t('nutri_unit')}</label>
                            <div className="relative">
                              <select 
                                value={data.unidadMedida} 
                                onChange={(e) => setData({...data, unidadMedida: e.target.value})}
                                className={selectStyle}
                              >
                                {UNIDADES.map(u => <option key={u} value={u} className={optionStyle}>{t(`unit_${u}`)}</option>)}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[var(--brand-text)]">▼</div>
                            </div>
                          </div>
                        </div>

                        {allPets.length > 0 && alimentoStatus && (
                          <div className="space-y-3 text-left">
                             <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70 block">{t('nutri_share_with')}</label>
                             <div className="flex flex-wrap gap-2">
                                {allPets.map(p => {
                                  const isSelected = data.compartidaConIds.includes(p.id);
                                  return (
                                    <button 
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                         setData({
                                           ...data,
                                           compartidaConIds: isSelected 
                                             ? data.compartidaConIds.filter(id => id !== p.id)
                                             : [...data.compartidaConIds, p.id]
                                         });
                                      }}
                                      className={`px-4 py-2 rounded-full border-2 transition-all text-[9px] font-black uppercase flex items-center gap-2 ${isSelected ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-primary)] shadow-md' : 'border-black/5 text-[var(--brand-text)] opacity-40 hover:opacity-60'}`}
                                    >
                                       <span className="text-xs">{p.realAvatar || '🐾'}</span>
                                       {p.nombre}
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-left">
                          <Input 
                              label={t('nutri_water_goal')}
                              type="number"
                              min={0}
                              value={data.metaAguaDiaria}
                              onChange={(e) => setData({...data, metaAguaDiaria: e.target.value})}
                              placeholder="Ej: 4"
                              suffix="🥣"
                          />
                          <Input 
                              label={t('nutri_reset_frequency')}
                              type="number"
                              min={1}
                              value={data.reinicioAguaDias}
                              onChange={(e) => setData({...data, reinicioAguaDias: e.target.value})}
                              placeholder="Ej: 1"
                              suffix="📅"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div 
                            onClick={() => setData({...data, vaciarAgua: !data.vaciarAgua})}
                            className="flex items-center gap-3 p-4 bg-[var(--brand-surface-muted)] rounded-2xl border-2 border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group/reset"
                            >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${data.vaciarAgua ? 'bg-cyan-500 border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-[var(--brand-primary)]/20'}`}>
                                {data.vaciarAgua && <CheckIcon />}
                                </div>
                                <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-[var(--brand-text)] tracking-tight">{t('nutri_reset_water')}</p>
                                <p className="text-[8px] font-bold text-[var(--brand-text)] opacity-40 uppercase">{t('nutri_reset_water_desc')}</p>
                                </div>
                            </div>

                            {alimentoStatus && (
                                <div 
                                onClick={() => setData({...data, vaciarComida: !data.vaciarComida})}
                                className="flex items-center gap-3 p-4 bg-[var(--brand-surface-muted)] rounded-2xl border-2 border-transparent hover:border-red-500/30 transition-all cursor-pointer group/reset"
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${data.vaciarComida ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/20' : 'border-[var(--brand-primary)]/20'}`}>
                                    {data.vaciarComida && <CheckIcon />}
                                    </div>
                                    <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-[var(--brand-text)] tracking-tight">{t('nutri_reset_food')}</p>
                                    <p className="text-[8px] font-bold text-[var(--brand-text)] opacity-40 uppercase">{t('nutri_reset_food_desc')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => handleSaveConfig()}
                            disabled={loading}
                            className="w-full py-4 bg-[var(--brand-primary)] text-white font-black rounded-2xl shadow-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon />}
                            {t('form_save')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-left-4 duration-300 text-left">
                        <Input 
                            label={t('nutri_brand')}
                            value={data.marca}
                            onChange={(e) => setData({...data, marca: e.target.value})}
                            placeholder="Ej: Pro Plan"
                        />
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <Input 
                                label={t('nutri_total_weight')}
                                type="number"
                                min={0.01}
                                step="0.01"
                                value={data.cantidadTotal}
                                onChange={(e) => setData({...data, cantidadTotal: e.target.value})}
                                placeholder="Ej: 15"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70 mb-1.5 block">{t('nutri_unit')}</label>
                            <div className="relative">
                              <select 
                                value={data.compraUnidad} 
                                onChange={(e) => setData({...data, compraUnidad: e.target.value})}
                                className={selectStyle}
                              >
                                {UNIDADES.map(u => <option key={u} value={u} className={optionStyle}>{t(`unit_${u}`)}</option>)}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[var(--brand-text)]">▼</div>
                            </div>
                          </div>
                        </div>

                        <Input 
                            label={t('nutri_cost')}
                            type="number"
                            min={0}
                            value={data.costo}
                            onChange={(e) => setData({...data, costo: e.target.value})}
                            placeholder="0.00"
                            suffix={t('currency_symbol')}
                        />
                        <p className="text-[8px] font-black text-[var(--brand-text)] opacity-30 uppercase tracking-widest text-right mt-1 italic">{t('nutri_currency')}: {t('currency_code')}</p>

                        <button 
                            onClick={() => handleRegisterBuy()}
                            disabled={loading || !data.cantidadTotal || parseFloat(data.cantidadTotal) <= 0}
                            className="w-full py-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black rounded-2xl shadow-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+'}
                            {t('nutri_register_buy')}
                        </button>
                    </div>
                )}
            </div>
          </>
        )}

        {conflictData && !success && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
             <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-orange-500/20">
                <span className="text-4xl animate-pulse">⚠️</span>
             </div>
             <h3 className="text-orange-600 font-black text-2xl italic tracking-tighter mb-4 text-center uppercase leading-none">{t('nutri_conflict_title')}</h3>
             <div className="bg-[var(--brand-surface-muted)] p-6 rounded-[2rem] border-2 border-orange-500/10 w-full mb-8 text-center shadow-inner">
                <p className="text-[var(--brand-text)] text-[10px] font-bold mb-3 opacity-60 uppercase">{t('nutri_conflict_desc')}</p>
                <p className="text-[var(--brand-primary)] text-sm font-black mb-4 tracking-tighter italic">{conflictData.pets?.join(' • ')}</p>
                <p className="text-[var(--brand-text)] text-[10px] font-bold opacity-60 italic">{t('nutri_conflict_question')}</p>
             </div>
             
             <div className="flex flex-col gap-3 w-full shrink-0">
                <button 
                  onClick={() => conflictData.context === 'buy' ? handleRegisterBuy('merge') : handleSaveConfig('merge')}
                  className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest active:scale-95"
                >
                  {t('nutri_conflict_merge')}
                </button>
                <button 
                  onClick={handleCloseInternal}
                  className="w-full py-4 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-70 transition-all active:scale-95"
                >
                  {t('nutri_conflict_keep_ind')}
                </button>
             </div>
          </div>
        )}

        {success && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20 animate-bounce border-4 border-white/20">
                    <div className="scale-[2] text-white"><CheckIcon /></div>
                </div>
                <p className="text-[var(--brand-primary)] text-xl font-black uppercase tracking-widest italic text-center drop-shadow-sm">
                  {t(activeTab === 'config' ? 'nutri_save_success' : 'nutri_buy_success')}
                </p>
            </div>
        )}

      </div>
    </div>
  );
}
