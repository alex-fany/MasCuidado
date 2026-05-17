import React, { useEffect, useState } from 'react';
import { LogoutIcon, CheckIcon, ShieldIcon, CalendarIcon, TrophyIcon, SettingsIcon, UsersIcon, CloseIcon, PhoneIcon } from '../common/Icons';
import Input from '../Input';
import AvatarSelector from './AvatarSelector';
import { AVATAR_OPTIONS } from '../../constants/avatars';
import { useSettings } from '../../context/SettingsContext';

const LADAS = [
  { code: '+52', country: 'MX' }, { code: '+1', country: 'US' }, { code: '+34', country: 'ES' },
  { code: '+54', country: 'AR' }, { code: '+57', country: 'CO' }, { code: '+56', country: 'CL' }
];

const CardWrapper = ({ children, className = "" }) => (
  <div 
    className={`rounded-[2.5rem] border-4 border-[var(--brand-border-strong)] shadow-xl overflow-hidden flex flex-col ${className}`}
    style={{ background: 'var(--brand-modal-gradient)' }}
  >
    {children}
  </div>
);

export default function ProfileView({ onLogout, onEditPet, pets }) {
  const { t, language } = useSettings();
  const [user, setUser] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  
  const [form, setForm] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    lada: '+52',
    imagen: '',
    colorAvatar: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data);
      
      const fullPhone = data.telefono || '';
      let lada = '+52', phone = fullPhone;
      if (fullPhone.startsWith('+')) {
        const parts = fullPhone.split(' ');
        if (parts.length > 1) { lada = parts[0]; phone = parts.slice(1).join(''); }
      }

      setForm({
        nombreCompleto: data.nombreCompleto || data.nombre_completo || '',
        email: data.correo || '',
        telefono: phone.replace(/\D/g, ''),
        lada: lada,
        imagen: data.imagen || '',
        colorAvatar: data.colorAvatar || '#2d9b96'
      });
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  const validate = (type) => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (type === 'name' || !type) {
      if (!form.nombreCompleto.trim()) newErrors.nombreCompleto = t('form_name') + ' ' + t('form_required');
    }
    
    if (type === 'contact' || !type) {
      if (!form.email.trim()) newErrors.email = t('err_required_fields');
      else if (!emailRegex.test(form.email)) newErrors.email = t('form_invalid_email');

      if (form.telefono && (form.telefono.length < 10 || form.telefono.length > 15)) {
        newErrors.telefono = t('err_min_phone');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (type) => {
    if (!validate(type)) return;
    
    const token = localStorage.getItem("token");
    const finalData = {
      nombre_completo: form.nombreCompleto.trim(),
      correo: form.email.trim(),
      telefono: `${form.lada} ${form.telefono}`,
      imagen: form.imagen,
      colorAvatar: form.colorAvatar
    };

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(finalData)
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...savedUser, ...updated }));
        
        if (type === 'name') setIsEditingName(false);
        if (type === 'contact') setIsEditingContact(false);
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onLogout();
      }
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
    }
  };

  const renderAvatar = () => {
    if (user?.imagen) {
      const avatarObj = AVATAR_OPTIONS.find(a => a.id === user.imagen);
      if (avatarObj) {
        return <div className="w-full h-full p-6" dangerouslySetInnerHTML={{ __html: avatarObj.svg.replace(/{{COLOR}}/g, user.colorAvatar || '#2d9b96') }} />;
      }
    }
    return user?.googleId ? '🎨' : '👤';
  };

  if (loading && !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const dateLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  return (
    <section className="h-full w-full max-w-[1400px] mx-auto flex flex-col px-6 pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden text-left">
      
      {/* Header */}
      <header className="mb-4 flex justify-between items-center px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] border-2 border-[var(--brand-border-strong)] flex items-center justify-center text-[var(--brand-button-text)] shadow-lg rotate-3">
            <UsersIcon />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tighter italic leading-none">{t('nav_profile')}</h2>
            <p className="text-[var(--brand-accent)] font-black text-[8px] uppercase tracking-[0.3em] mt-0.5 opacity-90 italic">{t('profile_panel')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-danger-muted)]/10 text-[var(--brand-danger)]/60 font-black rounded-full border border-[var(--brand-danger)]/5 hover:bg-[var(--brand-danger-muted)] hover:text-[var(--brand-danger)] transition-all text-[9px] uppercase tracking-widest active:scale-95"
          >
            {t('profile_deactivate')}
          </button>
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] border border-[var(--brand-border-strong)] text-[var(--brand-button-text)] font-black rounded-full shadow-md hover:opacity-80 transition-all text-[10px] uppercase tracking-widest active:scale-95"
          >
            <LogoutIcon /> {t('profile_logout')}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* Identidad */}
        <div className="lg:col-span-4 flex flex-col gap-5 min-h-0">
          <CardWrapper className="flex-1 justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
               <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                 {t('profile_active')}
               </span>
            </div>

            <div className="relative mx-auto mt-12 mb-6 group cursor-pointer" onClick={() => setIsAvatarSelectorOpen(true)}>
              <div className="w-36 h-36 rounded-[3rem] bg-[var(--brand-primary)] flex items-center justify-center text-6xl text-white border-8 border-[var(--brand-border-strong)] shadow-2xl relative z-10 rotate-2 group-hover:rotate-0 transition-transform">
                {renderAvatar()}
              </div>
              <div className="absolute -inset-2 bg-[var(--brand-primary)]/10 rounded-[2.5rem] blur-xl -z-10 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--brand-primary)] rounded-full border-4 border-[var(--brand-modal-bg)] flex items-center justify-center text-[var(--brand-button-text)] text-sm shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                 ✎
              </div>
            </div>
            
            <div className="mb-8 flex justify-center items-center gap-2 group relative">
              {!isEditingName ? (
                <>
                  <h3 className="text-2xl font-black text-[var(--brand-primary)] italic tracking-tight leading-tight px-2 group-hover:opacity-60 transition-opacity">
                    {user.nombreCompleto || user.nombre_completo}
                  </h3>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center scale-75 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--brand-primary)] hover:text-white"
                  >
                    ✎
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                   <input 
                     type="text"
                     value={form.nombreCompleto}
                     onChange={(e) => setForm({...form, nombreCompleto: e.target.value})}
                     autoFocus
                     maxLength={30}
                     className={`w-full text-center text-xl font-black text-[var(--brand-primary)] italic bg-[var(--brand-surface-muted)] border-2 rounded-2xl p-2 outline-none transition-all ${errors.nombreCompleto ? 'border-red-500 shadow-inner' : 'border-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] shadow-sm'}`}
                     placeholder={t('form_name')}
                   />
                   <div className="flex gap-2">
                      <button onClick={() => handleSave('name')} className="w-8 h-8 rounded-full bg-[#a0ec06] text-teal-900 flex items-center justify-center hover:opacity-80 transition-all shadow-md active:scale-90 font-black">✓</button>
                      <button onClick={() => { setIsEditingName(false); fetchUserData(); }} className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-gray-500 transition-all shadow-md active:scale-90 font-black">✕</button>
                   </div>
                   {errors.nombreCompleto && <p className="text-[8px] font-black text-red-500 uppercase italic">{errors.nombreCompleto}</p>}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full mt-auto">
               <div className="bg-[var(--brand-surface-muted)] p-3 rounded-2xl border border-[var(--brand-primary)]/5 shadow-inner">
                  <p className="text-[7px] font-black text-[var(--brand-primary)] uppercase">{t('profile_member_since')}</p>
                  <p className="text-[10px] font-black text-[var(--brand-text)] opacity-60 uppercase">{new Date(user.fechaRegistro).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })}</p>
               </div>
            </div>
          </CardWrapper>
        </div>

        {/* Datos Detallados */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <CardWrapper className="flex-1 p-8 relative">
            <div className="flex items-center justify-between mb-8 border-b border-[var(--brand-primary)]/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] scale-75"><SettingsIcon /></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-80 italic">{t('profile_info')}</h4>
              </div>
              
              {!isEditingContact ? (
                <button 
                  onClick={() => setIsEditingContact(true)}
                  className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center hover:bg-[var(--brand-primary)] hover:text-white transition-all shadow-sm active:scale-90"
                  title="Editar Contacto"
                >
                  ✎
                </button>
              ) : (
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleSave('contact')}
                    className="w-8 h-8 rounded-full bg-[#a0ec06] text-teal-900 flex items-center justify-center hover:opacity-80 transition-all shadow-md active:scale-90 font-black"
                    title="Guardar"
                  >
                    ✓
                  </button>
                  <button 
                    onClick={() => { setIsEditingContact(false); setErrors({}); fetchUserData(); }}
                    className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-gray-500 transition-all shadow-md active:scale-90 font-black"
                    title="Cancelar"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 text-left">
              {!isEditingContact ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-60">{t('profile_email')}</p>
                    <div className="bg-[var(--brand-surface-muted)] p-4 rounded-2xl border border-[var(--brand-primary)]/10 shadow-inner">
                      <span className="font-bold text-[var(--brand-text)] text-sm">{user.correo}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-60">{t('profile_phone')}</p>
                    <div className="bg-[var(--brand-surface-muted)] p-4 rounded-2xl border border-[var(--brand-primary)]/10 shadow-inner flex items-center gap-3">
                      <div className="text-[var(--brand-primary)] opacity-60"><PhoneIcon /></div>
                      <span className="font-black text-[var(--brand-text)] text-sm tracking-widest">{user.telefono || "Sin número"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('form_email')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className={`w-full px-5 py-3.5 bg-[var(--brand-surface-muted)] border-2 rounded-2xl font-bold text-sm outline-none transition-all ${errors.email ? 'border-red-500 shadow-inner' : 'border-transparent focus:border-[var(--brand-primary)] shadow-sm'}`}
                    />
                    {errors.email && <p className="text-[8px] font-black text-red-500 uppercase italic ml-2">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-1 text-left w-full">
                    <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">{t('profile_phone')}</label>
                    <div className={`flex gap-2 h-[52px] rounded-2xl border-2 transition-all ${errors.telefono ? 'border-red-500 shadow-inner' : 'border-transparent'}`}>
                      <select name="lada" value={form.lada} onChange={(e) => setForm({...form, lada: e.target.value})} className="w-20 bg-[var(--brand-surface-muted)] border-2 border-[var(--brand-primary)]/10 rounded-xl text-[var(--brand-text)] font-black text-[10px] outline-none p-2 shadow-inner appearance-none cursor-pointer">
                        {LADAS.map(l => <option key={l.code} value={l.code}>{l.country} {l.code}</option>)}
                      </select>
                      <input
                        type="tel"
                        name="telefono"
                        value={form.telefono}
                        onChange={(e) => setForm({...form, telefono: e.target.value.replace(/\D/g, '')})}
                        placeholder={t('ph_phone_num')}
                        className="flex-1 h-full px-5 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-xl text-[var(--brand-text)] font-bold text-sm outline-none shadow-inner"
                      />
                    </div>
                    {errors.telefono && <p className="text-[8px] font-black text-red-500 uppercase italic ml-2 mt-1">{errors.telefono}</p>}
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase text-center animate-pulse mt-4">
                   {t('profile_success')}
                </div>
              )}
            </div>
          </CardWrapper>
        </div>

        {/* Manada */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <CardWrapper className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--brand-primary)]/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] scale-75"><CalendarIcon /></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-80 italic">{t('profile_pack')}</h4>
              </div>
              <div className="bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] border border-[var(--brand-border-strong)] px-3 py-1 rounded-full shadow-lg">
                <span className="text-[10px] font-black text-[var(--brand-button-text)]">{pets?.length || 0}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {pets?.length > 0 ? (
                pets.map((m) => (
                  <div key={m.id} className="bg-[var(--brand-surface)] p-3 rounded-2xl flex items-center justify-between border border-[var(--brand-primary)]/10 shadow-sm transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner overflow-hidden border border-[var(--brand-primary)]/10">
                        {m.imagen ? (
                          <img src={`http://localhost:3000/uploads/${m.imagen}`} alt={m.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span>{m.realAvatar || '🐾'}</span>
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-black text-[var(--brand-text)] text-xs tracking-tight leading-none">{m.nombre}</span>
                        <span className="text-[8px] font-black uppercase text-[var(--brand-primary)]/50 mt-0.5">{m.raza || t(`pet_${m.tipo.toLowerCase()}`)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onEditPet(m)}
                      className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-all scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Editar Mascota"
                    >
                      ✎
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-2 grayscale">
                   <div className="text-5xl">🦴</div>
                   <p className="text-[9px] font-black uppercase italic tracking-widest">{t('profile_no_members')}</p>
                </div>
              )}
            </div>
          </CardWrapper>
        </div>

      </div>

      {isAvatarSelectorOpen && (
        <AvatarSelector 
          currentAvatar={form.imagen}
          currentColor={form.colorAvatar}
          onSelect={(avatarId, avatarColor) => {
            setForm({...form, imagen: avatarId, colorAvatar: avatarColor});
            const token = localStorage.getItem("token");
            fetch("/api/users/me", {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ imagen: avatarId, colorAvatar: avatarColor })
            }).then(res => res.json()).then(data => {
               setUser(data);
               const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
               localStorage.setItem("user", JSON.stringify({ ...savedUser, ...data }));
            });
          }}
          onClose={() => setIsAvatarSelectorOpen(false)}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-[var(--brand-primary)]/20 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--brand-primary)]/10">
                <span className="text-4xl">👋</span>
              </div>
              <h3 className="text-[var(--brand-primary)] font-black text-2xl mb-2 italic tracking-tighter">{t('profile_logout_confirm_title')}</h3>
              <p className="text-[var(--brand-text)] text-xs font-bold mb-8 leading-relaxed opacity-60">{t('profile_logout_confirm_desc')}</p>
              <div className="flex flex-col gap-3">
                <button onClick={onLogout} className="w-full py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-xl text-xs uppercase tracking-widest hover:bg-[var(--brand-secondary)] transition-all shadow-lg active:scale-95">{t('profile_logout_confirm_btn')}</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-70 transition-all">{t('profile_cancel')}</button>
              </div>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-[var(--brand-danger)]/20 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-[var(--brand-danger-muted)] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--brand-danger)]/10">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-[var(--brand-danger)] font-black text-2xl mb-2 italic tracking-tighter">{t('profile_delete_confirm_title')}</h3>
              <p className="text-[var(--brand-text)] text-xs font-bold mb-8 leading-relaxed opacity-60">{t('profile_delete_confirm_desc')}</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAccount} className="w-full py-4 bg-[var(--brand-danger)] text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95">{t('profile_delete_confirm_btn')}</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-70 transition-all">{t('profile_cancel')}</button>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
