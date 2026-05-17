import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons';
import Input from '../Input';
import { useSettings } from '../../context/SettingsContext';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const { t, language } = useSettings();
  const [form, setForm] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    lada: '+52'
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      const fullPhone = user.telefono || '';
      let lada = '+52';
      let phone = fullPhone;

      if (fullPhone.startsWith('+')) {
        const parts = fullPhone.split(' ');
        if (parts.length > 1) {
          lada = parts[0];
          phone = parts.slice(1).join('');
        }
      }

      setForm({
        nombreCompleto: user.nombreCompleto || user.nombre_completo || '',
        telefono: phone.replace(/\D/g, ''),
        direccion: user.direccion || '',
        lada: lada
      });
    }
  }, [user]);

  // Validación
  const validate = () => {
    const newErrors = {};

    if (!form.nombreCompleto.trim()) {
      newErrors.nombreCompleto = t('form_name') + ' ' + t('form_required');
    } else if (form.nombreCompleto.trim().length < 3) {
      newErrors.nombreCompleto = t('err_too_short_name');
    }

    if (form.telefono) {
      if (form.telefono.length < 10 || form.telefono.length > 15) {
        newErrors.telefono = t('err_min_phone');
      }
     }

    if (form.direccion.trim()) {
      if (form.direccion.trim().length < 10) {
       newErrors.direccion = t('err_too_short_dir');}
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación en tiempo real
  useEffect(() => {
    validate();
  }, [form]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefono') {
      const onlyNums = value.replace(/\D/g, '');
      setForm(prev => ({ ...prev, [name]: onlyNums }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    const finalData = {
      nombre_completo: form.nombreCompleto.trim(),
      direccion: form.direccion.trim(),
      telefono: `${form.lada} ${form.telefono}`
    };

    try {
      await onSave(finalData);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const ladas = [
    { code: '+52', country: 'MX' },
    { code: '+1', country: 'US/CA' },
    { code: '+34', country: 'ES' },
    { code: '+54', country: 'AR' },
    { code: '+57', country: 'CO' },
    { code: '+56', country: 'CL' },
    { code: '+51', country: 'PE' },
  ];

  return (
    
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      {success && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[var(--brand-backdrop)] backdrop-blur-xl animate-in fade-in duration-300">
          
          <div className="bg-[var(--brand-modal-bg)] rounded-[3rem] border-4 border-[var(--brand-primary)]/20 shadow-2xl px-8 py-10 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            
            <div className="text-4xl text-[var(--brand-primary)]"><CheckIcon /></div>

            <h3 className="text-[var(--brand-primary)] font-black italic text-lg">
              {t('profile_success')}
            </h3>

            <p className="text-[10px] uppercase tracking-widest text-[var(--brand-primary)]/60 font-bold text-center">
              {language === 'en' ? 'Your information has been saved successfully' : language === 'pt' ? 'Suas informações foram salvas com sucesso' : 'Tu información se guardó correctamente'}
            </p>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-md bg-[var(--brand-modal-bg)] rounded-[3rem] border-4 border-[var(--brand-border-strong)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--brand-primary)]/10 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent shrink-0">
          <div className="text-left">
            <h2 className="text-[var(--brand-primary)] text-xl font-black italic leading-tight tracking-tight">{t('profile_info')}</h2>
            <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]/60">{t('form_save')}</p>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform bg-[var(--brand-primary)]/5 p-1.5 rounded-full border border-[var(--brand-primary)]/10">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar text-left">
          
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-black text-[var(--brand-primary)] uppercase italic ml-2">
              {t('form_name')}
            </label>

            <Input
              name="nombreCompleto"
              value={form.nombreCompleto}
              onChange={handleChange}
              placeholder={t('ph_name')}
              disabled={!!user?.googleId}
              maxLength={30}
              className="bg-[var(--brand-surface-muted)] border-[var(--brand-primary)]/10 text-[var(--brand-text)]"
            />

            {errors.nombreCompleto && (
              <p className="text-red-500 text-[10px] font-black uppercase italic ml-2">{errors.nombreCompleto}</p>
            )}

            {user?.googleId && (
              <p className="text-[10px] font-bold text-[var(--brand-text)] opacity-40 italic ml-2 mt-1 flex items-center gap-1">
                <span>🔒</span> {language === 'en' ? 'Managed by Google' : language === 'pt' ? 'Gerenciado pelo Google' : 'Gestionado por Google'}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-black text-[var(--brand-primary)] uppercase italic ml-2">
              {t('profile_phone')}
            </label>

            <div className="flex gap-2">
              <select 
                name="lada"
                value={form.lada}
                onChange={handleChange}
                className="w-24 px-3 py-3.5 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-2xl text-[var(--brand-text)] font-bold outline-none appearance-none cursor-pointer text-sm shadow-sm"
              >
                {ladas.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.country} {l.code}
                  </option>
                ))}
              </select>

              <div className="flex-1">
                <Input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder={t('ph_phone_num')}
                  type="tel"
                  className="bg-[var(--brand-surface-muted)] border-[var(--brand-primary)]/10 text-[var(--brand-text)]"
                />
                {errors.telefono && (
                  <p className="text-red-500 text-[10px] font-black uppercase italic ml-2">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-black text-[var(--brand-primary)] uppercase italic ml-2">
              {language === 'en' ? 'Residence Address' : language === 'pt' ? 'Endereço de Residência' : 'Dirección de residencia'}
            </label>

            <textarea
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder={t('ph_notes')}
              className="w-full px-5 py-3.5 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-24 text-sm"
            />

            {errors.direccion && (
              <p className="text-red-500 text-[10px] font-black uppercase italic ml-2">{errors.direccion}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--brand-primary)]/10 bg-gradient-to-t from-[var(--brand-primary)]/5 to-transparent flex flex-col gap-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
            className="w-full py-4 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 active:translate-y-0.5 border-b-4 border-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xs uppercase tracking-widest italic">
              {t('form_save')}
            </span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--brand-surface)] border-2 border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 font-black rounded-xl hover:opacity-100 transition-all text-xs uppercase tracking-widest active:scale-95"
          >
            {t('profile_cancel')}
          </button>
        </div>

      </div>
    </div>
  );
}