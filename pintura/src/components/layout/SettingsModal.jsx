import React from 'react';
import { CloseIcon, LogoutIcon } from '../common/Icons';

export default function SettingsModal({ isOpen, onClose, onLogout }) {
  if (!isOpen) return null;

  const settingsItems = [
    { label: "Tema y Estilo", icon: "🎨", desc: "Personaliza colores y aspecto" },
    { label: "Copia de Seguridad", icon: "☁️", desc: "Resguarda la info de tu mascota" },
    { label: "Seguridad", icon: "🔒", desc: "Cambiar contraseña y accesos" },
    { label: "Idioma", icon: "🌐", desc: "Español (Latinoamérica)" },
    { label: "Privacidad", icon: "🛡️", desc: "Control de datos compartidos" },
    { label: "Ayuda", icon: "❓", desc: "Preguntas frecuentes y soporte" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1f1e]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white shadow-[0_32px_64px_-15px_rgba(45,155,150,0.3)] rounded-[2.5rem] overflow-hidden border border-[#3aaba5]/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-7 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white">
          <div className="flex flex-col">
            <h2 className="text-[#2d9b96] text-2xl font-black leading-tight tracking-tight">Configuración</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3aaba5]/60 mt-0.5">Ajustes del sistema</span>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-4 no-scrollbar">
          <div className="space-y-1.5">
            {settingsItems.map((item, index) => (
              <button key={index} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-[#5fc4b8]/5 transition-all duration-300 group text-left border border-transparent hover:border-[#5fc4b8]/10 active:scale-[0.98]">
                <div className="flex items-center justify-center rounded-2xl bg-[#5fc4b8]/10 text-[#2d9b96] shrink-0 w-12 h-12 shadow-sm group-hover:bg-[#2d9b96] group-hover:text-white transition-all duration-300 text-xl">{item.icon}</div>
                <div className="flex flex-col flex-1">
                  <span className="text-[#2d9b96] text-base font-black leading-none">{item.label}</span>
                  <span className="text-[11px] text-[#3aaba5] font-bold mt-1 opacity-60 leading-none">{item.desc}</span>
                </div>
                <div className="text-[#3aaba5]/40 group-hover:translate-x-1 group-hover:text-[#2d9b96] transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 bg-gradient-to-t from-[#f0fdfa] to-white border-t border-[#3aaba5]/10">
          <button onClick={onLogout} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-500 font-black rounded-[1.5rem] transition-all duration-300 flex items-center justify-center gap-3 border border-red-100 active:scale-95 group shadow-sm">
            <div className="text-red-500"><LogoutIcon /></div>
            Cerrar Sesión
          </button>
          <div className="mt-4 text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3aaba5]/40">+Cuidado v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
