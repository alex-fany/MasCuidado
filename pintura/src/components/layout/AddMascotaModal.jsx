import React, { useState, useRef } from 'react';
import { CloseIcon } from '../common/Icons';
import Input from '../Input';
import Button from '../Button';
import { useSettings } from '../../context/SettingsContext';

export default function AddMascotaModal({ isOpen, onClose, onRefreshPets, activePetId }) {
  const { t } = useSettings();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Perro',
    raza: '',
    edad: '',
    peso: '',
    genero: 'Macho',
    color: '',
    senasParticulares: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = t('form_pet_name') + ' ' + t('form_required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });
    
    if (imageFile) {
      dataToSend.append('imagen', imageFile);
    }

    try {
      const res = await fetch("/api/mascotas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: dataToSend
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }

      setFormData({
        nombre: '', tipo: 'Perro', raza: '', edad: '', peso: '',
        genero: 'Macho', color: '', senasParticulares: ''
      });
      setImageFile(null);
      setImagePreview(null);
      onRefreshPets(true); 
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300">
      <div 
        className="rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[var(--brand-primary)]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        style={{ background: 'var(--brand-modal-gradient)' }}
      >
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-50 bg-[var(--brand-surface-muted)] p-2 rounded-full"
        >
          <CloseIcon />
        </button>

        <h2 className="text-4xl font-black text-[var(--brand-primary)] mb-6 shrink-0 tracking-tighter italic">
          {t('header_add_pet')}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-left">
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5 pb-6">
            {error && (
              <div className="p-4 bg-[var(--brand-danger-muted)] text-[var(--brand-danger)] rounded-2xl text-[11px] font-black border-2 border-[var(--brand-danger)]/10 animate-bounce">
                ⚠️ ERROR: {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-3xl bg-[var(--brand-surface-muted)] border-4 border-dashed border-[var(--brand-primary)]/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--brand-primary)] transition-all group relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[var(--brand-secondary)] flex flex-col items-center group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📸</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="space-y-1">
              <Input
                label={t('form_pet_name')}
                placeholder={t('ph_pet_name')}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                error={!!errors.nombre}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_species')}</label>
                <select
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Perro">{t('pet_perro')}</option>
                  <option value="Gato">{t('pet_gato')}</option>
                  <option value="Conejo">{t('pet_conejo')}</option>
                  <option value="Tortuga">{t('pet_tortuga')}</option>
                  <option value="Ave">{t('pet_ave')}</option>
                  <option value="Hamster">{t('pet_hamster')}</option>
                  <option value="Otro">{t('pet_otro')}</option>
                </select>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_gender')}</label>
                <select
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                >
                  <option value="Macho">{t('gender_macho')}</option>
                  <option value="Hembra">{t('gender_hembra')}</option>
                </select>
              </div>
            </div>

            <Input label={t('form_breed')} placeholder={t('ph_breed')} value={formData.raza} onChange={(e) => setFormData({ ...formData, raza: e.target.value })} />

            <div className="grid grid-cols-2 gap-4">
              <Input label={t('form_age')} type="number" min={0} value={formData.edad} onChange={(e) => setFormData({ ...formData, edad: e.target.value })} />
              <Input label={t('form_weight')} type="number" step="0.1" min={0} value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} />
            </div>

            <div className="space-y-2 pb-4 text-left">
              <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_notes')}</label>
              <textarea
                className="w-full p-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-2xl text-[var(--brand-text)] font-bold text-xs outline-none h-24 resize-none shadow-inner"
                placeholder={t('ph_notes')}
                value={formData.senasParticulares}
                onChange={(e) => setFormData({ ...formData, senasParticulares: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <Button type="submit" loading={loading} className="w-full py-5 rounded-[1.5rem] text-lg shadow-2xl shadow-[var(--brand-primary)]/40 font-black uppercase tracking-widest italic">
              {t('form_register_pet')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
