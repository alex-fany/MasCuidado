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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1f1e]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-[#3aaba5]/20 animate-in zoom-in-95 slide-in-from-top-4 duration-500 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white shrink-0">
          <div className="flex flex-col text-left">
            <h2 className="text-[#2d9b96] text-xl font-black leading-tight tracking-tight text-left italic">Perfil</h2>
            <span className="text-xs font-black uppercase tracking-[0.1em] text-[#3aaba5]/60">Gestión de Cuenta</span>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 px-6 custom-scrollbar space-y-4">
          {!user ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2d9b96]"></div>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Nombre</p>
                <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10">
                  <span className="font-bold text-gray-800 text-sm">{user.nombreCompleto || user.nombre_completo}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Correo</p>
                <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10">
                  <span className="font-bold text-gray-800 text-sm">{user.correo}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Dirección</p>
                <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10">
                  <span className="font-bold text-gray-800 text-xs leading-relaxed">{user.direccion || "No registrada"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Teléfono</p>
                  <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10">
                    <span className="font-bold text-gray-800 text-sm">{user.telefono || "---"}</span>
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Registro</p>
                  <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10">
                    <span className="font-bold text-gray-800 text-sm">
                      {new Date(user.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left pb-2">
                <p className="text-xs font-black text-[#2d9b96] uppercase tracking-widest italic ml-1 opacity-70">Mascotas</p>
                <div className="bg-[#f0fdfa] p-3 rounded-xl border border-[#3aaba5]/10 flex flex-wrap gap-2">
                  {user.mascotas && user.mascotas.length > 0 ? (
                    user.mascotas.map((m) => (
                      <span key={m.id} className="bg-white px-2.5 py-1 rounded-full text-[10px] font-black text-[#2d9b96] border border-[#2d9b96]/20 shadow-sm">
                        {m.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold italic">Sin mascotas</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gradient-to-t from-[#f0fdfa] to-white border-t border-[#3aaba5]/10 shrink-0">
          <div className="flex flex-col gap-2.5">
            {/* Botón Editar */}
            <button
              onClick={() => setEditOpen(true)}
              className="w-full py-2.5 bg-gradient-to-r from-[#5fc4b8] to-[#2d9b96] text-white font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 group active:translate-y-0.5 border-b-4 border-black/10"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-500">
                <span className="text-lg leading-none">✎</span>
              </div>
              <span className="text-xs uppercase tracking-[0.1em] italic text-white">Editar Perfil</span>
            </button>

            {/* Botón Logout */}
            <button onClick={onLogout} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 font-black rounded-full transition-all duration-300 flex items-center justify-center gap-3 border border-red-100 active:scale-95 group shadow-sm text-[10px] uppercase tracking-widest">
              <div className="text-red-500"><LogoutIcon /></div>
              Cerrar Sesión
            </button>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#3aaba5]/30 mt-4 text-center italic">
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
