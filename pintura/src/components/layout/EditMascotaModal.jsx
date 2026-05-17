import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../common/Icons';
import Input from '../Input';
import Button from '../Button';

const EditMascotaModal = ({ isOpen, onClose, onRefreshPets, pet }) => {
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

  useEffect(() => {
    if (pet) {
      setFormData({
        nombre: pet.nombre || '',
        tipo: pet.tipo || 'Perro',
        raza: pet.raza || '',
        edad: pet.edad || '',
        peso: pet.peso || '',
        genero: pet.genero || 'Macho',
        color: pet.color || '',
        senasParticulares: pet.senasParticulares || ''
      });
      if (pet.imagen) {
        setImagePreview(`http://localhost:3000/uploads/${pet.imagen}`);
      } else {
        setImagePreview(null);
      }
    }
  }, [pet, isOpen]);

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
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });
    
    if (imageFile) {
      dataToSend.append('imagen', imageFile);
    }

    try {
      const res = await fetch(`/api/mascotas/${pet.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: dataToSend
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar mascota");
      }

      onRefreshPets(true); 
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--brand-backdrop)] backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative border-4 border-[var(--brand-primary)]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        style={{ background: 'var(--brand-modal-gradient)' }}
      >
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-8 right-8 hover:scale-110 active:scale-90 transition-transform duration-200 z-50 bg-[var(--brand-surface-muted)] p-2 rounded-full"
        >
          <CloseIcon />
        </button>

        <h2 className="text-4xl font-black text-[var(--brand-primary)] mb-2 shrink-0 tracking-tighter italic">
          Editar Mascota
        </h2>
        <p className="text-[var(--brand-text)] opacity-40 font-bold text-sm mb-6 shrink-0 uppercase tracking-widest italic">Actualizar Información General</p>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5 pb-6">
            {error && (
              <div className="p-4 bg-[var(--brand-danger-muted)] text-[var(--brand-danger)] rounded-2xl text-[11px] font-black border-2 border-[var(--brand-danger)]/10 animate-bounce">
                ⚠️ ERROR: {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-3xl bg-[var(--brand-surface-muted)] border-4 border-dashed border-[var(--brand-primary)]/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--brand-primary)] transition-all group relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[var(--brand-secondary)] flex flex-col items-center group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📸</span>
                    <span className="text-[9px] font-black uppercase mt-1">Subir Foto</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <Input
              label="Nombre de la mascota"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">Especie</label>
                <select
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all appearance-none cursor-pointer shadow-sm"
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
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">Género</label>
                <select
                  className="w-full px-5 py-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] focus:bg-[var(--brand-surface)] rounded-[1.5rem] text-[var(--brand-text)] font-bold outline-none transition-all appearance-none cursor-pointer shadow-sm"
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
              value={formData.raza}
              onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Edad (años)" type="number" value={formData.edad} onChange={(e) => setFormData({ ...formData, edad: e.target.value })} />
              <Input label="Peso (kg)" type="number" step="0.1" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} />
            </div>

            <div className="space-y-2 pb-4 text-left">
              <label className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic ml-2 opacity-70">Señas Particulares</label>
              <textarea
                className="w-full p-4 bg-[var(--brand-surface-muted)] border-2 border-transparent focus:border-[var(--brand-primary)] rounded-2xl text-[var(--brand-text)] font-bold text-xs outline-none h-24 resize-none shadow-inner"
                value={formData.senasParticulares}
                onChange={(e) => setFormData({ ...formData, senasParticulares: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <Button type="submit" loading={loading} className="w-full py-5 rounded-[1.5rem] text-lg shadow-2xl shadow-[var(--brand-primary)]/40 font-black uppercase tracking-widest italic">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMascotaModal;
