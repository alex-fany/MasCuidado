import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons';
import Input from '../Input';
import { useSettings } from '../../context/SettingsContext';

export default function EditCartillaModal({ isOpen, onClose, pet, onSave }) {
  const { t } = useSettings();
  const [form, setForm] = useState({
    raza: '',
    edad: '',
    color: '',
    senasParticulares: '',
    padecimientos: '',
    medicamentos: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pet) {
      setForm({
        raza: pet.raza || '',
        edad: pet.edad || '',
        color: pet.color || '',
        senasParticulares: pet.senasParticulares || '',
        padecimientos: pet.padecimientos || '',
        medicamentos: pet.medicamentos || ''
      });
    }
  }, [pet, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(form);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-300 text-left">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {success && (
        <div className="absolute inset-0 z-[12000] flex items-center justify-center bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[var(--brand-modal-gradient)] rounded-[3rem] border-4 border-[var(--brand-primary)]/20 shadow-2xl px-8 py-10 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="text-4xl text-[var(--brand-primary)]"><CheckIcon /></div>
            <h3 className="text-[var(--brand-primary)] font-black italic text-lg">{t('profile_success')}</h3>
          </div>
        </div>
      )}

      <div 
        className="relative w-full max-w-md rounded-[3rem] border-4 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]"
        style={{ background: 'var(--brand-modal-gradient)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--brand-primary)]/10 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent shrink-0">
          <div>
            <h2 className="text-[var(--brand-primary)] text-xl font-black italic leading-tight">{t('form_edit_cartilla')}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-secondary)]/60">{t('home_activities_of')} {pet?.nombre}</p>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform bg-[var(--brand-surface-muted)] p-1.5 rounded-full border border-[var(--brand-primary)]/10">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_breed')}</label>
              <Input name="raza" value={form.raza} onChange={handleChange} placeholder={t('ph_breed')} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_age')}</label>
              <Input name="edad" type="number" value={form.edad} onChange={handleChange} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_color')}</label>
            <Input name="color" value={form.color} onChange={handleChange} placeholder={t('ph_color')} />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_notes')}</label>
            <textarea name="senasParticulares" placeholder={t('ph_notes')} value={form.senasParticulares} onChange={handleChange} className="w-full px-5 py-3 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-20 text-xs shadow-sm" />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 opacity-70">🧬 {t('form_conditions')}</label>
            <textarea name="padecimientos" placeholder={t('ph_notes')} value={form.padecimientos} onChange={handleChange} className="w-full px-5 py-3 bg-purple-500/5 border-2 border-transparent focus:border-purple-400 focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-20 text-xs shadow-sm" />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 opacity-70">💊 {t('form_medications')}</label>
            <textarea name="medicamentos" placeholder={t('ph_notes')} value={form.medicamentos} onChange={handleChange} className="w-full px-5 py-3 bg-purple-500/5 border-2 border-transparent focus:border-purple-400 focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-20 text-xs shadow-sm" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--brand-primary)]/10 bg-gradient-to-t from-[var(--brand-primary)]/5 to-transparent flex flex-col gap-3 shrink-0">
          <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 active:translate-y-0.5 border-b-4 border-black/10">
            <span className="text-xs uppercase tracking-widest italic">{t('form_update_cartilla')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
