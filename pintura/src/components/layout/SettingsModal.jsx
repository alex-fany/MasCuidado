import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, LogoutIcon } from '../common/Icons';
import ThemeSection from './settings/sections/ThemeSection';
import LanguageSection from './settings/sections/LanguageSection';
import { useSettings } from '../../context/SettingsContext';

export default function SettingsModal({ isOpen, onClose, onLogout }) {
  const { t, language } = useSettings();
  const [activeSection, setActiveSection] = useState('main');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveSection('main');
    setShowLogoutConfirm(false);
    onClose();
  };

  const settingsItems = [
    { id: 'theme', label: language === 'en' ? "Theme & Style" : language === 'pt' ? "Tema e Estilo" : "Tema y Estilo", icon: "🎨", desc: language === 'en' ? "Customize colors and look" : language === 'pt' ? "Personalize cores e aparência" : "Personaliza colores y aspecto", active: true },
    { id: 'backup', label: language === 'en' ? "Backup" : language === 'pt' ? "Cópia de Segurança" : "Copia de Seguridad", icon: "☁️", desc: language === 'en' ? "Save your pet info" : language === 'pt' ? "Proteja as informações do seu pet" : "Resguarda la info de tu mascota", active: false },
    { id: 'security', label: language === 'en' ? "Security" : language === 'pt' ? "Segurança" : "Seguridad", icon: "🔒", desc: language === 'en' ? "Change password and access" : language === 'pt' ? "Alterar senha e acessos" : "Cambiar contraseña y accesos", active: false },
    { id: 'language', label: language === 'en' ? "Language" : language === 'pt' ? "Idioma" : "Idioma", icon: "🌐", desc: language === 'en' ? "Regional preferences" : language === 'pt' ? "Preferências regionais" : "Preferencias regionales", active: true },
    { id: 'privacy', label: language === 'en' ? "Privacy" : language === 'pt' ? "Privacidade" : "Privacidad", icon: "🛡️", desc: language === 'en' ? "Control shared data" : language === 'pt' ? "Controle de dados compartilhados" : "Control de datos compartidos", active: false },
    { id: 'help', label: language === 'en' ? "Help" : language === 'pt' ? "Ajuda" : "Ayuda", icon: "❓", desc: language === 'en' ? "FAQ and support" : language === 'pt' ? "Perguntas frequentes e suporte" : "Preguntas frecuentes y soporte", active: false },
  ];

  const getHeaderInfo = () => {
    switch (activeSection) {
      case 'theme': return { title: language === 'en' ? "Theme & Style" : language === 'pt' ? "Tema e Estilo" : "Tema y Estilo", subtitle: language === 'en' ? "Visual Customization" : language === 'pt' ? "Personalização Visual" : "Personalización Visual" };
      case 'language': return { title: language === 'en' ? "Language" : language === 'pt' ? "Idioma" : "Idioma", subtitle: language === 'en' ? "Regional Preferences" : language === 'pt' ? "Preferências Regionais" : "Preferencias Regionales" };
      default: return { title: language === 'en' ? "Settings" : language === 'pt' ? "Configurações" : "Configuración", subtitle: language === 'en' ? "System Adjustments" : language === 'pt' ? "Ajustes do Sistema" : "Ajustes del Sistema" };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-[#0a1f1e]/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[var(--brand-modal-bg)] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden border border-[var(--brand-primary)]/20 flex flex-col max-h-[85vh] backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-7 border-b border-[var(--brand-primary)]/10 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent shrink-0">
            <div className="flex items-center gap-4">
              <AnimatePresence mode='wait'>
                {activeSection !== 'main' && (
                  <motion.button 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => setActiveSection('main')}
                    className="p-2 -ml-2 hover:bg-[var(--brand-primary)]/10 rounded-xl text-[var(--brand-primary)] transition-colors active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </motion.button>
                )}
              </AnimatePresence>
              <div className="flex flex-col">
                <motion.h2 
                  key={title}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[var(--brand-primary)] text-2xl font-black leading-tight tracking-tight"
                >
                  {title}
                </motion.h2>
                <motion.span 
                  key={subtitle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]/60 mt-0.5"
                >
                  {subtitle}
                </motion.span>
              </div>
            </div>
            <button onClick={handleClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
              <CloseIcon />
            </button>
          </div>
          
          {/* Principal */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeSection === 'main' ? (
                <motion.div 
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 overflow-y-auto py-3 px-4 no-scrollbar"
                >
                  <div className="space-y-1.5 pb-4">
                    {settingsItems.map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => item.active && setActiveSection(item.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group text-left border border-transparent active:scale-[0.98] ${
                          item.active 
                            ? 'hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/10' 
                            : 'opacity-40 grayscale cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shrink-0 w-12 h-12 shadow-sm group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all duration-300 text-xl">
                          {item.icon}
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[var(--brand-primary)] text-base font-black leading-none">{item.label}</span>
                          <span className="text-[11px] text-[var(--brand-secondary)] font-bold mt-1 opacity-60 leading-none">{item.desc}</span>
                        </div>
                        {item.active && (
                          <div className="text-[var(--brand-secondary)]/40 group-hover:translate-x-1 group-hover:text-[var(--brand-primary)] transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div key="detail" className="flex-1 overflow-hidden">
                  {activeSection === 'theme' && <ThemeSection />}
                  {activeSection === 'language' && <LanguageSection />}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <AnimatePresence>
            {activeSection === 'main' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-6 bg-gradient-to-t from-[var(--brand-primary)]/5 to-transparent border-t border-[var(--brand-primary)]/10 shrink-0"
              >
                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className="w-full py-4 bg-[var(--brand-danger-muted)] hover:bg-[var(--brand-danger)]/20 text-[var(--brand-danger)] font-black rounded-[1.5rem] transition-all duration-300 flex items-center justify-center gap-3 border border-[var(--brand-danger)]/10 active:scale-95 group shadow-sm"
                >
                  <div className="text-[var(--brand-danger)]"><LogoutIcon /></div>
                  {t('profile_logout')}
                </button>
                <div className="mt-4 text-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--brand-primary)]/40">+Cuidado v1.0.0</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Confirmación Global */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--brand-modal-bg)] rounded-[2.5rem] p-8 shadow-2xl border-4 border-[var(--brand-primary)]/20 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--brand-primary)]/10">
                <span className="text-4xl">👋</span>
              </div>
              <h3 className="text-[var(--brand-primary)] font-black text-2xl mb-2 italic tracking-tighter">{t('profile_logout_confirm_title')}</h3>
              <p className="text-[var(--brand-text)] text-xs font-bold mb-8 leading-relaxed opacity-60">{t('profile_logout_confirm_desc')}</p>
              <div className="flex flex-col gap-3">
                <button onClick={onLogout} className="w-full py-4 bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-xl text-xs uppercase tracking-widest hover:bg-[var(--brand-secondary)] transition-all shadow-lg active:scale-95">
                  {t('profile_logout_confirm_btn')}
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 bg-[var(--brand-surface-muted)] text-[var(--brand-text)] font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-70 transition-all">
                  {t('profile_cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
