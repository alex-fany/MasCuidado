import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons';
import Input from '../Input';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    lada: '+52'
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      const fullPhone = user.telefono || '';
      let lada = '+52';
      let phone = fullPhone;

      if (fullPhone.startsWith('+')) {
        const parts = fullPhone.split(' ');
        if (parts.length > 1) {
          lada = parts[0];
          phone = parts.slice(1).join('');
        }
      }

      setForm({
        nombreCompleto: user.nombreCompleto || user.nombre_completo || '',
        telefono: phone.replace(/\D/g, ''),
        direccion: user.direccion || '',
        lada: lada
      });
    }
  }, [user]);

  // Validación
  const validate = () => {
    const newErrors = {};

    if (!form.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre es obligatorio';
    } else if (form.nombreCompleto.trim().length < 3) {
      newErrors.nombreCompleto = 'Debe tener al menos 3 caracteres';
    }

    if (form.telefono) {
      if (form.telefono.length < 8 || form.telefono.length > 15) {
        newErrors.telefono = 'Número inválido';
      }
     }

    if (form.direccion.trim()) {
      if (form.direccion.trim().length < 10) {
       newErrors.direccion = 'Dirección demasiado corta';}
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación en tiempo real
  useEffect(() => {
    validate();
  }, [form]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefono') {
      const onlyNums = value.replace(/\D/g, '');
      setForm(prev => ({ ...prev, [name]: onlyNums }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    const finalData = {
      nombre_completo: form.nombreCompleto.trim(),
      direccion: form.direccion.trim(),
      telefono: `${form.lada} ${form.telefono}`
    };

    try {
      await onSave(finalData);

//      setSuccess(true);

    //  setTimeout(() => {
       // setSuccess(false);
       // onClose();
      //}, 2000);

    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const ladas = [
    { code: '+52', country: 'MX' },
    { code: '+1', country: 'US/CA' },
    { code: '+34', country: 'ES' },
    { code: '+54', country: 'AR' },
    { code: '+57', country: 'CO' },
    { code: '+56', country: 'CL' },
    { code: '+51', country: 'PE' },
  ];

  return (
    
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a1f1e]/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      {success && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[#0a1f1e]/80 backdrop-blur-xl animate-in fade-in duration-300">
          
          <div className="bg-white rounded-[3rem] border-4 border-[#3aaba5]/20 shadow-2xl px-8 py-10 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            
            <div className="text-4xl"><CheckIcon></CheckIcon></div>

            <h3 className="text-[#2d9b96] font-black italic text-lg">
              Datos actualizados
            </h3>

            <p className="text-[10px] uppercase tracking-widest text-[#3aaba5]/60 font-bold text-center">
              Tu información se guardó correctamente
            </p>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-md bg-white rounded-[3rem] border-4 border-[#3aaba5]/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white shrink-0">
          <div className="text-left">
            <h2 className="text-[#2d9b96] text-xl font-black italic leading-tight tracking-tight">Mis Datos</h2>
            <p className="text-xs font-black uppercase tracking-widest text-[#3aaba5]/60">Actualizar Información</p>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform bg-[#f0fdfa] p-1.5 rounded-full border border-[#3aaba5]/10">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-black text-[#2d9b96] uppercase italic ml-2">
              Nombre completo
            </label>

            <Input
              name="nombreCompleto"
              value={form.nombreCompleto}
              onChange={handleChange}
              placeholder="Tu nombre real"
              disabled={!!user?.googleId}
            />

            {errors.nombreCompleto && (
              <p className="text-red-500 text-xs ml-2">{errors.nombreCompleto}</p>
            )}

            {user?.googleId && (
              <p className="text-xs font-bold text-gray-400 italic ml-2 mt-1 flex items-center gap-1">
                <span>🔒</span> Gestionado por Google
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-black text-[#2d9b96] uppercase italic ml-2">
              Teléfono móvil
            </label>

            <div className="flex gap-2">
              <select 
                name="lada"
                value={form.lada}
                onChange={handleChange}
                className="w-24 px-3 py-3.5 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-2xl text-gray-700 font-bold outline-none appearance-none cursor-pointer text-sm shadow-sm"
              >
                {ladas.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.country} {l.code}
                  </option>
                ))}
              </select>

              <div className="flex-1">
                <Input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="3782562153"
                  type="tel"
                />
                {errors.telefono && (
                  <p className="text-red-500 text-xs ml-2">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-black text-[#2d9b96] uppercase italic ml-2">
              Dirección de residencia
            </label>

            <textarea
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Tu calle, número y colonia..."
              className="w-full px-5 py-3.5 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all resize-none h-24 text-sm"
            />

            {errors.direccion && (
              <p className="text-red-500 text-xs ml-2">{errors.direccion}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3aaba5]/10 bg-gradient-to-t from-[#f0fdfa] to-white flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
            className="w-full py-4 bg-gradient-to-r from-[#5fc4b8] to-[#2d9b96] text-white font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 active:translate-y-0.5 border-b-4 border-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xs uppercase tracking-widest italic">
              Guardar Cambios
            </span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white border-2 border-gray-100 text-gray-400 font-black rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-all text-xs uppercase tracking-widest active:scale-95"
          >
            Cancelar edición
          </button>
        </div>

      </div>
    </div>
  );
}