import React, { useState, useEffect } from 'react';
import { CloseIcon, GoogleCalendarBrandIcon } from '../common/Icons';
import Input from '../Input';
import Button from '../Button';
import { useSettings } from '../../context/SettingsContext';

export default function AddReminderModal({ isOpen, onClose, pets = [], onRefreshReminders, initialDate, editReminder, activePetId }) {
  const { t, language } = useSettings();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '09:00',
    mascotaId: '',
    syncGoogle: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Obtener estado del usuario localmente
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGoogleLinked = user.isGoogleLinked;

  useEffect(() => {
    if (!isOpen) return;

    if (editReminder) {
      const date = new Date(editReminder.fechaHora);
      setFormData({
        titulo: editReminder.titulo,
        descripcion: editReminder.descripcion || '',
        fecha: date.toISOString().split('T')[0],
        hora: date.toTimeString().split(' ')[0].substring(0, 5),
        mascotaId: editReminder.mascotaId,
        syncGoogle: !!editReminder.idEventoGoogle
      });
    } else {
      const date = initialDate || new Date();
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: date.toISOString().split('T')[0],
        hora: '09:00',
        mascotaId: activePetId || (pets.length > 0 ? pets[0].id : ''),
        syncGoogle: false
      });
    }
  }, [isOpen, editReminder, initialDate, activePetId, pets]);

  const handleToggleSync = () => {
    if (!isGoogleLinked && !formData.syncGoogle) {
      setIsLinkingModalOpen(true);
    } else {
      setFormData({ ...formData, syncGoogle: !formData.syncGoogle });
    }
  };

  const handleConnectGoogle = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/google-calendar/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { url } = await res.json();
      
      const popup = window.open(url, 'GoogleAuth', 'width=500,height=600');

      window.onmessage = async (event) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { refresh_token } = event.data;
          await fetch('/api/google-calendar/save-token', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ refresh_token })
          });

          // Actualizar usuario en localStorage
          user.isGoogleLinked = true;
          localStorage.setItem('user', JSON.stringify(user));
          
          setIsLinkingModalOpen(false);
          setFormData({ ...formData, syncGoogle: true });
        }
      };
    } catch (err) {
      alert(language === 'en' ? "Connection error" : "Error al conectar con Google");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const fechaHora = `${formData.fecha}T${formData.hora}:00`;

    try {
      const url = editReminder ? `/api/recordatorios/${editReminder.id}` : "/api/recordatorios";
      const method = editReminder ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fechaHora: fechaHora,
          mascotaId: formData.mascotaId,
          syncGoogle: formData.syncGoogle
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }

      onRefreshReminders(true); // Indicar éxito para mostrar el toast
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300">
        <div 
          className="rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[var(--brand-primary)]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
          style={{ background: 'var(--brand-modal-gradient)' }}
        >
          
          <button type="button" onClick={onClose} className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-50 bg-[var(--brand-surface-muted)] p-2 rounded-full">
            <CloseIcon />
          </button>

          <h2 className="text-4xl font-black text-[var(--brand-primary)] mb-2 shrink-0 tracking-tighter italic text-left">
            {editReminder ? t('form_edit_rem') : t('form_new_rem')}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-left mt-4">
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5 pb-6">
              {error && <div className="p-4 bg-[var(--brand-danger-muted)] text-[var(--brand-danger)] rounded-2xl text-[11px] font-black border-2 border-[var(--brand-danger)]/10">{error}</div>}

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_select_pet')}</label>
                <select
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={formData.mascotaId}
                  onChange={(e) => setFormData({ ...formData, mascotaId: e.target.value })}
                  required
                >
                  {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.nombre}</option>)}
                </select>
              </div>

              <Input
                label={t('form_rem_title')}
                placeholder={t('ph_rem_title')}
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label={t('form_rem_date')} type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
                <Input label={t('form_rem_time')} type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_rem_desc')}</label>
                <textarea
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all resize-none h-28 shadow-sm"
                  placeholder={t('ph_notes')}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div 
                className={`p-5 rounded-[2rem] border-2 flex items-center justify-between group cursor-pointer transition-all ${formData.syncGoogle ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20' : 'bg-[var(--brand-surface-muted)] border-[var(--brand-border)] hover:border-[var(--brand-primary)]/20'}`} 
                onClick={handleToggleSync}
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--brand-surface)] rounded-xl flex items-center justify-center shadow-sm border border-[var(--brand-primary)]/10 scale-110">
                      <GoogleCalendarBrandIcon />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-tighter">{t('form_rem_sync')}</p>
                      <p className="text-[10px] text-[var(--brand-text)] opacity-40 font-bold leading-tight italic">{t('form_rem_sync_desc')}</p>
                    </div>
                 </div>
                 <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${formData.syncGoogle ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]' : 'border-[var(--brand-border)]'}`}>
                    {formData.syncGoogle && <div className="w-2 h-2 bg-[var(--brand-button-text)] rounded-full"></div>}
                 </div>
              </div>
            </div>

            <div className="pt-4 shrink-0">
              <button type="submit" className="w-full py-5 bg-[var(--brand-primary)] text-[var(--brand-button-text)] rounded-[1.5rem] text-lg shadow-2xl font-black hover:bg-[var(--brand-secondary)] transition-all">
                {editReminder ? t('form_save') : t('form_add_rem')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Vinculación de Google */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--brand-backdrop)] backdrop-blur-sm" onClick={() => setIsLinkingModalOpen(false)}></div>
          <div className="relative bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-[var(--brand-primary)]/20 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-[var(--brand-surface-muted)] rounded-full flex items-center justify-center mx-auto mb-6 scale-150">
              <GoogleCalendarBrandIcon />
            </div>
            <h3 className="text-2xl font-black text-[var(--brand-text)] mb-2 italic">{language === 'en' ? 'Synchronization' : language === 'pt' ? 'Sincronização' : 'Sincronización'}</h3>
            <p className="text-[var(--brand-text)] opacity-60 font-bold text-sm leading-relaxed mb-8">
              {language === 'en' ? 'To use this feature, you need to link your account with Google Calendar. It only takes a few seconds.' : language === 'pt' ? 'Para usar este recurso, você precisa vincular sua conta ao Google Calendar. Leva apenas alguns segundos.' : 'Para usar esta función, necesitas vincular tu cuenta con Google Calendar. Solo toma unos segundos.'}
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleConnectGoogle}
                className="w-full py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-2xl shadow-lg hover:bg-[var(--brand-secondary)] transition-all uppercase tracking-widest text-xs"
              >
                {language === 'en' ? 'Link now' : language === 'pt' ? 'Vincular agora' : 'Vincular ahora'}
              </button>
              <button 
                onClick={() => setIsLinkingModalOpen(false)}
                className="w-full py-3 text-[var(--brand-text)] opacity-40 font-black hover:opacity-100 transition-colors uppercase tracking-widest text-[10px]"
              >
                {language === 'en' ? 'Maybe later' : language === 'pt' ? 'Talvez depois' : 'Tal vez luego'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
