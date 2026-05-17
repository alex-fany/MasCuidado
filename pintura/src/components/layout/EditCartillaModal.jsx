import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, CheckIcon, BellIcon, ClockIcon, TrashIcon } from '../common/Icons';
import Input from '../Input';
import { useSettings } from '../../context/SettingsContext';

export default function EditCartillaModal({ isOpen, onClose, pet, onSave, prefillVaccineName }) {
  const { t, language } = useSettings();
  const [form, setForm] = useState({
    raza: '',
    edad: '',
    peso: '',
    genero: 'Macho',
    color: '',
    senasParticulares: '',
    padecimientos: '',
    medicamentos: ''
  });
  
  const [vacunasGrouped, setVacunasGrouped] = useState([]);
  const [fotosCartilla, setFotosCartilla] = useState([]);
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [confirmDoseIdx, setConfirmDoseIdx] = useState(null);
  const [groupToDeleteIdx, setGroupToDeleteIdx] = useState(null);
  
  const fotoInputRef = useRef(null);
  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (pet && isOpen) {
      setForm({
        raza: pet.raza || '',
        edad: pet.edad || '',
        peso: pet.peso || '',
        genero: pet.genero || 'Macho',
        color: pet.color || '',
        senasParticulares: pet.senasParticulares || '',
        padecimientos: pet.padecimientos || '',
        medicamentos: pet.medicamentos || ''
      });
      
      const groups = {};
      pet.vacunas?.forEach(v => {
        if (!groups[v.nombreVacuna]) {
          groups[v.nombreVacuna] = { dosis: [], proxima: '' };
        }
        groups[v.nombreVacuna].dosis.push({
          id: v.id || generateId(),
          fecha: v.fechaAplicacion.split('T')[0],
          isNew: false
        });
        if (v.proximaDosis) {
          const pDate = v.proximaDosis.split('T')[0];
          if (!groups[v.nombreVacuna].proxima || pDate > groups[v.nombreVacuna].proxima) {
            groups[v.nombreVacuna].proxima = pDate;
          }
        }
      });

      let initialGrouped = Object.entries(groups).map(([nombre, data]) => ({
        id: generateId(),
        nombre,
        proxima: data.proxima,
        dosis: data.dosis.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      }));

      if (prefillVaccineName) {
        const existingGroup = initialGrouped.find(g => g.nombre === prefillVaccineName);
        if (existingGroup) {
          const today = new Date().toISOString().split('T')[0];
          if (!existingGroup.dosis.some(d => d.fecha === today)) {
            existingGroup.dosis.unshift({ id: generateId(), fecha: today, isNew: true });
          }
        } else {
          initialGrouped.unshift({
            id: generateId(),
            nombre: prefillVaccineName,
            proxima: '',
            isNew: true,
            dosis: [{ id: generateId(), fecha: new Date().toISOString().split('T')[0], isNew: true }]
          });
        }
      }

      setVacunasGrouped(initialGrouped);
      setFotosExistentes(pet.fotosCartilla || []);
      setFotosCartilla([]);
      setErrorMsg(null);
      setConfirmDoseIdx(null);
      setGroupToDeleteIdx(null);
    }
  }, [pet, isOpen, prefillVaccineName]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAddVaccineGroup = () => {
    setVacunasGrouped([{ 
      id: generateId(), 
      nombre: '', 
      proxima: '', 
      isNew: true,
      dosis: [{ id: generateId(), fecha: new Date().toISOString().split('T')[0], isNew: true }] 
    }, ...vacunasGrouped]);
  };

  const handleUpdateGroupName = (idx, name) => {
    const updated = [...vacunasGrouped];
    updated[idx].nombre = name;
    setVacunasGrouped(updated);
  };

  const handleUpdateGroupProxima = (idx, proxima) => {
    const updated = [...vacunasGrouped];
    updated[idx].proxima = proxima;
    setVacunasGrouped(updated);
  };

  const handleTriggerAddDose = (idx) => {
    const today = new Date().toISOString().split('T')[0];
    const group = vacunasGrouped[idx];
    if (group.dosis.some(d => d.fecha === today)) {
      setConfirmDoseIdx(idx);
    } else {
      executeAddDose(idx, today);
    }
  };

  const executeAddDose = (idx, date) => {
    const updated = [...vacunasGrouped];
    updated[idx].dosis.unshift({ id: generateId(), fecha: date, isNew: true });
    setVacunasGrouped(updated);
    setConfirmDoseIdx(null);
  };

  const handleUpdateDose = (groupIdx, doseIdx, val) => {
    const updated = [...vacunasGrouped];
    if (updated[groupIdx].dosis.some((d, i) => d.fecha === val && i !== doseIdx)) {
       setErrorMsg(t('err_vac_already_reg'));
       setTimeout(() => setErrorMsg(null), 3000);
       return;
    }
    updated[groupIdx].dosis[doseIdx].fecha = val;
    setVacunasGrouped(updated);
  };

  const handleRemoveDose = (groupIdx, doseIdx) => {
    const updated = [...vacunasGrouped];
    updated[groupIdx].dosis = updated[groupIdx].dosis.filter((_, i) => i !== doseIdx);
    if (updated[groupIdx].dosis.length === 0) {
      setVacunasGrouped(updated.filter((_, i) => i !== groupIdx));
    } else {
      setVacunasGrouped(updated);
    }
  };

  const handleConfirmRemoveGroup = () => {
    if (groupToDeleteIdx !== null) {
      setVacunasGrouped(vacunasGrouped.filter((_, i) => i !== groupToDeleteIdx));
      setGroupToDeleteIdx(null);
    }
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    setFotosCartilla([...fotosCartilla, ...files]);
  };

  const handleRemoveFotoNueva = (idx) => {
    setFotosCartilla(fotosCartilla.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    
    const flattenedVacunas = [];
    vacunasGrouped.forEach(g => {
      g.dosis.forEach(d => {
        if (g.nombre.trim()) {
          flattenedVacunas.push({ nombre: g.nombre, fecha: d.fecha, proxima: g.proxima });
        }
      });
    });
    
    formData.append('vacunas', JSON.stringify(flattenedVacunas));
    fotosCartilla.forEach(file => formData.append('fotosCartilla', file));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/mascotas/${pet.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        if (onSave) await onSave();
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Error saving cartilla:", err);
    } finally {
      setLoading(false);
    }
  };

  const purpleInputClass = "[&_input]:bg-purple-600/10 [&_input]:border-purple-500/20 [&_input]:focus:bg-purple-600/15 [&_input]:focus:border-purple-500 [&_label]:text-purple-600";

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-300 text-left">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {errorMsg && (
        <div className="fixed top-10 left-0 right-0 flex justify-center z-[13000] pointer-events-none px-4">
          <div className="bg-red-600 text-white px-8 py-3 rounded-full shadow-2xl font-black text-xs animate-shake-toast flex items-center gap-3 pointer-events-auto">
             ⚠️ {errorMsg}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrar Grupo */}
      {groupToDeleteIdx !== null && (
        <div className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-red-500/20 max-w-sm w-full text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500/10 text-3xl">🗑️</div>
              <h3 className="text-xl font-black text-red-600 mb-2 italic tracking-tighter">{t('form_del_group_confirm_title')}</h3>
              <p className="text-[var(--brand-text)] text-xs font-bold opacity-60 mb-8 leading-relaxed">{t('form_del_group_confirm_desc')}</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleConfirmRemoveGroup} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest text-[10px]">
                   {t('form_del_group_btn')}
                 </button>
                 <button onClick={() => setGroupToDeleteIdx(null)} className="w-full py-3 text-[var(--brand-text)] opacity-40 font-black uppercase tracking-widest text-[9px] hover:opacity-100 transition-opacity">
                   {t('profile_cancel')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {confirmDoseIdx !== null && (
        <div className="fixed inset-0 z-[14000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-purple-500/20 max-w-sm w-full text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/10 text-3xl">💉</div>
              <h3 className="text-xl font-black text-purple-600 mb-2 italic tracking-tighter">
                {t('form_vac_already_today')}
              </h3>
              <p className="text-[var(--brand-text)] text-xs font-bold opacity-60 mb-8 leading-relaxed">
                {t('form_vac_already_today_desc')}
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={() => executeAddDose(confirmDoseIdx, new Date(Date.now() - 86400000).toISOString().split('T')[0])} className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all uppercase tracking-widest text-[10px]">
                   {t('form_vac_yes_past')}
                 </button>
                 <button onClick={() => setConfirmDoseIdx(null)} className="w-full py-3 text-[var(--brand-text)] opacity-40 font-black uppercase tracking-widest text-[9px] hover:opacity-100 transition-opacity">
                   {t('profile_cancel')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {success && (
        <div className="absolute inset-0 z-[12000] flex items-center justify-center bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--brand-modal-bg)] rounded-[3.5rem] border-4 border-[var(--brand-primary)]/40 shadow-2xl px-12 py-12 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300 max-w-sm w-full text-center">
            <div className="w-24 h-24 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center text-5xl text-[var(--brand-primary)] animate-bounce shadow-inner">
               <CheckIcon />
            </div>
            <div>
              <h3 className="text-[var(--brand-primary)] font-black italic text-2xl tracking-tighter mb-2">{t('profile_success')}</h3>
              <p className="text-[var(--brand-text)] opacity-60 font-bold text-xs uppercase tracking-widest">{t('form_medical_record')} actualizado</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className="relative w-full max-w-2xl rounded-[3rem] border-4 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[92vh]"
        style={{ background: 'var(--brand-modal-gradient)' }}
      >
        <div className="flex items-center justify-between p-7 border-b border-[var(--brand-primary)]/10 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/20 flex items-center justify-center text-3xl shadow-inner">
                {pet?.realAvatar}
             </div>
             <div>
                <h2 className="text-[var(--brand-primary)] text-2xl font-black italic leading-tight tracking-tight">{t('form_edit_cartilla')}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-secondary)]/60 italic">{pet?.nombre}</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform bg-[var(--brand-surface-muted)] p-2 rounded-full border border-[var(--brand-primary)]/10 shadow-sm">
            <CloseIcon />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
          
          {/* Información y diagnóstico */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-60 ml-2 italic">{t('form_info_diag')}</h3>
             <div className="grid grid-cols-2 gap-4">
                <Input label={t('form_breed')} name="raza" value={form.raza} onChange={handleChange} placeholder={t('ph_breed')} />
                <Input label={t('form_age')} name="edad" type="number" value={form.edad} onChange={handleChange} placeholder="0" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input label={t('form_weight')} name="peso" type="number" step="0.1" value={form.peso} onChange={handleChange} placeholder="0.0" />
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_gender')}</label>
                  <select name="genero" value={form.genero} onChange={handleChange} className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-[1.5rem] text-[var(--brand-text)] font-bold text-sm outline-none appearance-none cursor-pointer shadow-sm">
                    <option value="Macho">{t('gender_macho')}</option>
                    <option value="Hembra">{t('gender_hembra')}</option>
                  </select>
                </div>
             </div>
             <Input label={t('form_color')} name="color" value={form.color} onChange={handleChange} placeholder={t('ph_color')} />
             <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_notes')}</label>
                <textarea name="senasParticulares" placeholder={t('ph_notes')} value={form.senasParticulares} onChange={handleChange} className="w-full px-6 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-24 text-sm shadow-sm" />
             </div>
             <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 opacity-70">🧬 {t('form_conditions')}</label>
                <textarea name="padecimientos" placeholder="Alergias, cirugías, enfermedades crónicas..." value={form.padecimientos} onChange={handleChange} className="w-full px-6 py-4 bg-purple-500/5 border-2 border-transparent focus:border-purple-400 rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none h-24 resize-none text-sm shadow-sm" />
             </div>
             <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 opacity-70">💊 {t('form_medications')}</label>
                <textarea name="medicamentos" placeholder="Medicamentos actuales y dosis..." value={form.medicamentos} onChange={handleChange} className="w-full px-6 py-4 bg-purple-500/5 border-2 border-transparent focus:border-purple-400 rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none h-24 resize-none text-sm shadow-sm" />
             </div>
          </section>

          {/* Expediente físico */}
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 opacity-80 italic">{t('form_vac_physical')}</h3>
                <button onClick={() => fotoInputRef.current?.click()} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-full hover:bg-emerald-600 hover:text-white transition-all">📸 {t('form_vac_upload')}</button>
                <input type="file" ref={fotoInputRef} multiple accept="image/*" className="hidden" onChange={handleFotoChange} />
             </div>
             <div className="grid grid-cols-3 gap-3">
                {fotosExistentes.map((f, i) => (
                  <div key={`old-${i}`} className="aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/20 relative shadow-sm"><img src={`http://localhost:3000/uploads/${f}`} className="w-full h-full object-cover" alt="Cartilla" /></div>
                ))}
                {fotosCartilla.map((f, i) => (
                  <div key={`new-${i}`} className="aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/40 relative shadow-md animate-in zoom-in-90">
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="Preview" />
                    <button onClick={() => handleRemoveFotoNueva(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs shadow-lg flex items-center justify-center hover:scale-110 transition-transform">✕</button>
                  </div>
                ))}
                {fotosExistentes.length === 0 && fotosCartilla.length === 0 && (
                   <div onClick={() => fotoInputRef.current?.click()} className="col-span-3 py-12 border-2 border-dashed border-emerald-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 transition-all group">
                      <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">📄</span>
                      <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest group-hover:text-emerald-500">{t('form_vac_digitalize')}</span>
                   </div>
                )}
             </div>
          </section>

          {/* Esquema de vacunación */}
          <section className="space-y-6 pb-4">
             <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 italic">{t('form_vac_scheme')}</h3>
                   <p className="text-[8px] font-bold text-[var(--brand-text)] opacity-40 uppercase tracking-widest mt-0.5">{t('form_vac_control')}</p>
                </div>
                <button onClick={handleAddVaccineGroup} className="text-[9px] font-black uppercase tracking-widest text-white bg-purple-600 px-6 py-2.5 rounded-full hover:bg-purple-700 transition-all shadow-lg active:scale-95 border-b-4 border-purple-900/30">+ {t('form_vac_new')}</button>
             </div>
             
             <div className="space-y-8">
                {vacunasGrouped.map((group, gIdx) => (
                  <div key={group.id} className={`bg-purple-500/5 border-2 rounded-[2.5rem] p-6 space-y-6 relative animate-in slide-in-from-right-4 duration-300 transition-all ${group.isNew ? 'animate-glow-new border-purple-500' : 'border-purple-500/20'}`}>
                     <button 
                       onClick={() => setGroupToDeleteIdx(gIdx)} 
                       className="absolute top-1 right-1 text-purple-300 hover:text-red-500 transition-all flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-500/10 z-10"
                       title={t('form_del_group_btn')}
                     >
                       <TrashIcon />
                     </button>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('form_vac_name')} value={group.nombre} onChange={(e) => handleUpdateGroupName(gIdx, e.target.value)} placeholder="Ej: Rabia..." className={purpleInputClass} />
                        <Input label={t('form_vac_next_reinf')} type="date" value={group.proxima} onChange={(e) => handleUpdateGroupProxima(gIdx, e.target.value)} className={purpleInputClass} />
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                           <p className="text-[8px] font-black uppercase text-purple-600 opacity-60 tracking-widest">{t('form_vac_applied_history')}</p>
                           <button onClick={() => handleTriggerAddDose(gIdx)} className="text-[8px] font-black text-purple-600 underline uppercase tracking-widest hover:text-purple-800">+ {t('form_vac_add_past')}</button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                           {group.dosis.map((dose, dIdx) => (
                              <div key={dose.id} className={`p-3.5 rounded-2xl border flex items-center gap-4 relative group/dose transition-all ${dose.isNew ? 'animate-glow-new bg-purple-100 dark:bg-purple-900/30 border-purple-400 shadow-md' : 'bg-purple-500/5 border-purple-500/10'}`}>
                                 <div className="flex-1">
                                    <Input label={t('form_vac_date_apply')} type="date" value={dose.fecha} onChange={(e) => handleUpdateDose(gIdx, dIdx, e.target.value)} className={purpleInputClass} />
                                 </div>
                                 <button onClick={() => handleRemoveDose(gIdx, dIdx)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover/dose:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">✕</button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="p-8 border-t border-[var(--brand-primary)]/10 bg-gradient-to-t from-[var(--brand-primary)]/5 to-transparent shrink-0">
          <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-full shadow-2xl hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:translate-y-0.5 border-b-4 border-black/10">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="text-sm uppercase tracking-widest italic">{t('form_update_cartilla')}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
