import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons';
import Input from '../Input';

export default function EditPetModal({ isOpen, onClose, pet, onSave }) {
  const [form, setForm] = useState({
    raza: '',
    edad: '',
    color: '',
    senasParticulares: '',
    padecimientos: '',
    medicamentos: ''
  });

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pet) {
      setForm({
        raza: pet.raza || '',
        edad: pet.edad || '',
        color: pet.color || '',
        senasParticulares: pet.senasParticulares || '',
        padecimientos: pet.padecimientos || '',
        medicamentos: pet.medicamentos || ''
      });
    }
  }, [pet]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await onSave(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[#0a1f1e]/80 backdrop-blur-xl animate-in fade-in duration-300 text-left">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {success && (
        <div className="absolute inset-0 z-[12000] flex items-center justify-center bg-[#0a1f1e]/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] border-4 border-[#3aaba5]/20 shadow-2xl px-8 py-10 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="text-4xl text-[#2d9b96]"><CheckIcon /></div>
            <h3 className="text-[#2d9b96] font-black italic text-lg">Cartilla Actualizada</h3>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md bg-white rounded-[3rem] border-4 border-[#3aaba5]/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3aaba5]/10 bg-gradient-to-b from-[#f0fdfa] to-white shrink-0">
          <div>
            <h2 className="text-[#2d9b96] text-xl font-black italic leading-tight">Editar Cartilla</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3aaba5]/60">Información de {pet?.nombre}</p>
          </div>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform bg-[#f0fdfa] p-1.5 rounded-full border border-[#3aaba5]/10">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Raza</label>
              <Input name="raza" value={form.raza} onChange={handleChange} placeholder="Ej. Poodle" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Edad (Años)</label>
              <Input name="edad" type="number" value={form.edad} onChange={handleChange} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Color dominante</label>
            <Input name="color" value={form.color} onChange={handleChange} placeholder="Ej. Café con manchas blancas" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Señas Particulares</label>
            <textarea name="senasParticulares" value={form.senasParticulares} onChange={handleChange} className="w-full px-5 py-3 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all resize-none h-20 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 italic">🧬 Padecimientos</label>
            <textarea name="padecimientos" value={form.padecimientos} onChange={handleChange} className="w-full px-5 py-3 bg-purple-50/30 border-2 border-transparent focus:border-purple-400 focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all resize-none h-20 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-purple-600 uppercase italic ml-2 italic">💊 Medicamentos</label>
            <textarea name="medicamentos" value={form.medicamentos} onChange={handleChange} className="w-full px-5 py-3 bg-purple-50/30 border-2 border-transparent focus:border-purple-400 focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all resize-none h-20 text-xs" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3aaba5]/10 bg-gradient-to-t from-[#f0fdfa] to-white flex flex-col gap-3 shrink-0">
          <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-[#5fc4b8] to-[#2d9b96] text-white font-black rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 active:translate-y-0.5 border-b-4 border-black/10">
            <span className="text-xs uppercase tracking-widest italic">Actualizar Cartilla</span>
          </button>
        </div>
      </div>
    </div>
  );
}