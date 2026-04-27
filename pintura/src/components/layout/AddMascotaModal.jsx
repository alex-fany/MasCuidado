import React, { useState, useRef } from 'react';
import { CloseIcon } from '../common/Icons';
import Input from '../Input';
import Button from '../Button';

export default function AddMascotaModal({ isOpen, onClose, onRefreshPets }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Perro',
    raza: '',
    edad: '',
    peso: '',
    genero: 'Macho',
    color: '',
    senasParticulares: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    
    // ERROR REAL SOLUCIONADO: Usamos FormData para enviar archivo + datos
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });
    
    if (imageFile) {
      dataToSend.append('imagen', imageFile);
    }

    try {
      const res = await fetch("/api/mascotas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // NOTA: No poner Content-Type manual con FormData, pq el navegador lo hace solo
        },
        body: dataToSend
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear mascota");

      onRefreshPets(true); // Pasamos true para indicar éxito y mostrar toast
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // z-[9999] para superar BottomNav y layout padre
    <div className="fixed inset-0 bg-[#0a1f1e]/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[#3aaba5]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-50 bg-teal-50 p-2 rounded-full"
        >
          <CloseIcon />
        </button>

        <h2 className="text-4xl font-black text-[#2d9b96] mb-2 shrink-0 tracking-tighter italic">
          Nueva Mascota
        </h2>
        <p className="text-gray-400 font-bold text-sm mb-6 shrink-0 uppercase tracking-widest italic">Registro de Vida</p>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5 pb-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black border-2 border-red-100 animate-bounce">
                ⚠️ ERROR: {error}
              </div>
            )}

            {/* Subida de Imagen */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-3xl bg-[#f0fdfa] border-4 border-dashed border-[#3aaba5]/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#2d9b96] transition-all group relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[#3aaba5] flex flex-col items-center group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📸</span>
                    <span className="text-[9px] font-black uppercase mt-1">Subir Foto</span>
                  </div>
                )}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>

            <Input
              label="Nombre de la mascota"
              placeholder="Ej: Trapeador"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Especie</label>
                <select
                  className="w-full px-5 py-4 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all appearance-none cursor-pointer"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Perro">🐶 Perro</option>
                  <option value="Gato">🐱 Gato</option>
                  <option value="Conejo">🐰 Conejo</option>
                  <option value="Tortuga">🐢 Tortuga</option>
                  <option value="Ave">🦜 Ave</option>
                  <option value="Hamster">🐹 Hámster</option>
                  <option value="Otro">🐾 Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Género</label>
                <select
                  className="w-full px-5 py-4 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all appearance-none cursor-pointer"
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                >
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
            </div>

            <Input
              label="Raza"
              placeholder="Ej: Golden Retriever"
              value={formData.raza}
              onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Edad (años)"
                type="number"
                placeholder="0"
                value={formData.edad}
                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
              />
              <Input
                label="Peso (kg)"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              />
            </div>

            <div className="space-y-2 pb-4">
              <label className="text-[10px] font-black text-[#2d9b96] uppercase italic ml-2">Señas Particulares</label>
              <textarea
                className="w-full px-5 py-4 bg-[#f0fdfa] border-2 border-transparent focus:border-[#2d9b96] focus:bg-white rounded-[1.5rem] text-gray-700 font-bold outline-none transition-all resize-none h-28"
                placeholder="Marcas o cicatrices..."
                value={formData.senasParticulares}
                onChange={(e) => setFormData({ ...formData, senasParticulares: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <Button 
              type="submit" 
              loading={loading} 
              className="w-full py-5 rounded-[1.5rem] text-lg shadow-2xl shadow-[#2d9b96]/40 font-black"
            >
              Confirmar Registro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
