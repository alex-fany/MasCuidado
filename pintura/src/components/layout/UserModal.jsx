import React, { useEffect, useState } from 'react';
import { CloseIcon, LogoutIcon } from '../common/Icons';
import EditUserModal from './EditUserModal';

export default function UserModal({ isOpen, onClose, onLogout }) {
  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
     
      fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Error en la respuesta");
          return res.json();
        })
        .then(data => setUser(data))
        .catch(err => console.error("Error al cargar perfil:", err));
    }
  }, [isOpen]);

  const handleSave = async (data) => {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setEditOpen(false);
    }
  };

  if (!isOpen) return null;

  return(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--brand-backdrop)] backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-[var(--brand-modal-bg)] shadow-2xl rounded-[2.5rem] overflow-hidden border border-[var(--brand-primary)]/20 animate-in zoom-in-95 slide-in-from-top-4 duration-500 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--brand-primary)]/10 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent shrink-0">
          <div className="flex flex-col text-left">
            <h2 className="text-[var(--brand-primary)] text-xl font-black leading-tight tracking-tight text-left italic">Perfil</h2>
            <span className="text-xs font-black uppercase tracking-[0.1em] text-[var(--brand-primary)]/60">Gestión de Cuenta</span>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 px-6 custom-scrollbar space-y-4">
          {!user ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]"></div>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Nombre</p>
                <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10">
                  <span className="font-bold text-[var(--brand-text)] text-sm">{user.nombreCompleto || user.nombre_completo}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Correo</p>
                <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10">
                  <span className="font-bold text-[var(--brand-text)] text-sm">{user.correo}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Dirección</p>
                <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10">
                  <span className="font-bold text-[var(--brand-text)] text-xs leading-relaxed">{user.direccion || "No registrada"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Teléfono</p>
                  <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10">
                    <span className="font-bold text-[var(--brand-text)] text-sm">{user.telefono || "---"}</span>
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Registro</p>
                  <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10">
                    <span className="font-bold text-[var(--brand-text)] text-sm">
                      {new Date(user.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left pb-2">
                <p className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest italic ml-1 opacity-70">Mascotas</p>
                <div className="bg-[var(--brand-surface-muted)] p-3 rounded-xl border border-[var(--brand-primary)]/10 flex flex-wrap gap-2">
                  {user.mascotas && user.mascotas.length > 0 ? (
                    user.mascotas.map((m) => (
                      <span key={m.id} className="bg-[var(--brand-surface)] px-2.5 py-1 rounded-full text-[10px] font-black text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 shadow-sm">
                        {m.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-[var(--brand-text)] opacity-40 font-bold italic">Sin mascotas</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gradient-to-t from-[var(--brand-primary)]/5 to-transparent border-t border-[var(--brand-primary)]/10 shrink-0">
          <div className="flex flex-col gap-2.5">
            {/* Botón Editar */}
            <button
              onClick={() => setEditOpen(true)}
              className="w-full py-2.5 bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] text-[var(--brand-button-text)] font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 group active:translate-y-0.5 border-b-4 border-black/10"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                <span className="text-lg leading-none">✎</span>
              </div>
              <span className="text-xs uppercase tracking-[0.1em] italic">Editar Perfil</span>
            </button>

            {/* Botón Logout */}
            <button onClick={onLogout} className="w-full py-2.5 bg-[var(--brand-danger-muted)] hover:bg-[var(--brand-danger)]/20 text-[var(--brand-danger)] font-black rounded-full transition-all duration-300 flex items-center justify-center gap-3 border border-[var(--brand-danger)]/10 active:scale-95 group shadow-sm text-[10px] uppercase tracking-widest">
              <div className="text-[var(--brand-danger)]"><LogoutIcon /></div>
              Cerrar Sesión
            </button>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]/30 mt-4 text-center italic">
            MasCuidado v1.2
          </p>
        </div>

        <EditUserModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
          onSave={handleSave}
        />
      </div>
    </div>
  ); 
}
