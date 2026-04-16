import React, { useEffect, useState } from 'react';
import { CloseIcon, LogoutIcon } from './Icons';


export default function UserModal({ isOpen, onClose, onLogout }) {


  const [user, setUser] = useState(null);


  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
     
      fetch("http://localhost:3000/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);


  if (!isOpen) return null;


  return(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1f1e]/60 backdrop-blur-md animate-in fade-in duration-300">
     
      <div className="absolute inset-0" onClick={onClose}></div>


      <div className="relative w-full max-w-md bg-white shadow-[0_32px_64px_-15px_rgba(45,155,150,0.3)] rounded-[2.5rem] overflow-hidden border border-[#3aaba5]/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">


        {/* HEADER */}
        <div className="flex items-center justify-between p-7 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white">
          <div className="flex flex-col">
            <h2 className="text-[#2d9b96] text-2xl font-black leading-tight tracking-tight">Perfil de usuario</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3aaba5]/60 mt-0.5">+Cuidado</span>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform duration-200">
            <CloseIcon />
          </button>
        </div>


        {/* BODY */}
        <div className="flex-1 overflow-y-auto py-3 px-4 no-scrollbar">


          {!user ? (
            <div className="p-3">Cargando...</div>
          ) : (
            <>
              {/* NOMBRE */}
              <div className="p-3 space-y-1.5 flex flex-col items-start rounded-[1rem] shadow-md/20">
                <span className="font-black text-gray-800">Nombre:</span>
                <span className="text-s text-gray-800">{user.nombre_completo}</span>
              </div>


              {/* CORREO */}
              <div className="my-2 p-3 space-y-1.5 flex flex-col items-start rounded-[1rem] shadow-md/20">
                <span className="font-black text-gray-800">Correo:</span>
                <span className="text-s text-gray-800">{user.correo}</span>
              </div>

             {/* TELEFONO*/}
              <div className="my-2 p-3 space-y-1.5 flex flex-col items-start rounded-[1rem] shadow-md/20">
                <span className="font-black text-gray-800">Teléfono:</span>
                <span className="text-s text-gray-800">{user.telefono||"No registrado"}<span className="text-lg text-[#2d9b96] mx-3 font-bold leading-none">+</span>
                </span>
              </div>
              {/* DIRECCION */}
              <div className="my-2 p-3 space-y-1.5 flex flex-col items-start rounded-[1rem] shadow-md/20">
                <span className="font-black text-gray-800">Dirección:</span>
                <span className="text-s text-gray-800">{user.direccion||"No registrado"}<span className="text-lg text-[#2d9b96] mx-3 font-bold leading-none">+</span>
                </span>
              </div>
              {/* MASCOTAS */}
              <div className="p-3 space-y-1.5 flex flex-col items-start rounded-[1rem] shadow-md/20">
              <span className="font-black text-gray-800">Mascotas:</span>
                {user.mascota.length === 0 ? (
                  <span className="text-s text-gray-800">Sin mascotas</span>
                ) : (
                  user.mascota.map((m, i) => (
                    <span key={i} className="text-s text-gray-800">
                      {m.nombre}
                    </span>
                  ))
                )}
              </div>
            </>
          )}

        </div>

        {/* FOOTER */}
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
