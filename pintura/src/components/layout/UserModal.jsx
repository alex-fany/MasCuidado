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

      <div className="relative w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-[#3aaba5]/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between p-7 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white shrink-0">
          <div className="flex flex-col text-left">
            <h2 className="text-[#2d9b96] text-2xl font-black leading-tight tracking-tight text-left">Perfil de usuario</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3aaba5]/60 mt-0.5">Gestión de Cuenta</span>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
            <CloseIcon />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto py-6 px-7 custom-scrollbar space-y-6">
          {!user ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d9b96]"></div>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Nombre Completo</p>
                <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10">
                  <span className="font-bold text-gray-800">{user.nombreCompleto || user.nombre_completo}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Correo Electrónico</p>
                <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10">
                  <span className="font-bold text-gray-800">{user.correo}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Dirección Residencial</p>
                  <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10">
                    <span className="font-bold text-gray-800">{user.direccion || "No registrada"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Teléfono</p>
                  <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10">
                    <span className="font-bold text-gray-800">{user.telefono || "---"}</span>
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Registro</p>
                  <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10">
                    <span className="font-bold text-gray-800">
                      {new Date(user.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black text-[#2d9b96] uppercase tracking-widest italic ml-1">Mascotas Vinculadas</p>
                <div className="bg-[#f0fdfa] p-4 rounded-2xl border border-[#3aaba5]/10 flex flex-wrap gap-2">
                  {user.mascotas && user.mascotas.length > 0 ? (
                    user.mascotas.map((m) => (
                      <span key={m.id} className="bg-white px-3 py-1 rounded-full text-xs font-black text-[#2d9b96] border border-[#2d9b96]/20 shadow-sm">
                        {m.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-bold italic">Sin mascotas registradas</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-7 bg-gradient-to-t from-[#f0fdfa] to-white border-t border-[#3aaba5]/10 shrink-0">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-[#2d9b96]/20 active:scale-95"
            >
              Editar Perfil
            </button>
            <button 
              onClick={onLogout} 
              className="w-full py-4 bg-white border-2 border-red-100 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <LogoutIcon />
              Cerrar Sesión
            </button>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3aaba5]/40 mt-6 text-center italic">
            MasCuidado Ecosystem • v1.2
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
