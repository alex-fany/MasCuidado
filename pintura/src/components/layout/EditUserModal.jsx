import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../common/Icons';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {

  const [form, setForm] = useState({
    nombre_completo: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        nombre_completo: user.nombre_completo || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a1f1e]/60 backdrop-blur-md animate-in fade-in duration-300">

      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] border border-[#3aaba5]/20 shadow-[0_32px_64px_-15px_rgba(45,155,150,0.3)] overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between p-7 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white">
          <h2 className="text-[#2d9b96] text-2xl font-black">Editar perfil</h2>
          <button onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 ">

          {/* NOMBRE */}
          <div className="flex flex-col">
            <label className="font-black text-gray-800 my-2">Nombre:</label>
            <input
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
              disabled={user.google_id}
              className=" rounded-[0.5rem] shadow-md/20 p-2 border border-gray-300"
            />
            {user.google_id && (
              <span className="text-xs text-gray-400">
                Vinculado con Google
              </span>
            )}
          </div>

          {/* TELÉFONO */}
          <div className="flex flex-col">
            <label className="font-black text-gray-800 my-2">Teléfono:</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="rounded-[0.5rem] shadow-md/20 p-2 border border-gray-300"
            />
          </div>

          {/* DIRECCIÓN */}
          <div className="flex flex-col">
            <label className="font-black text-gray-800 my-2">Dirección:</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="rounded-[0.5rem] shadow-md/20 p-2 border border-gray-300"
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-[#3aaba5]/10 flex gap-3 bg-gradient-to-b from-white to-[#f0fdfa]">
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-3 bg-[#2d9b96] text-white rounded-[1.5rem] hover:bg-[#23807c] font-black">
            Guardar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-[1.5rem] font-black text-gray-600 border border-gray-300" >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}