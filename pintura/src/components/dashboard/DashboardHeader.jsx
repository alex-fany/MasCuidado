import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, CheckIcon } from './Icons';

export default function DashboardHeader({ onConfigClick, activePet, pets, setActivePetId }) {
  const [isPetSelectorOpen, setIsPetSelectorOpen] = useState(false);
  const petDropdownRef = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (petDropdownRef.current && !petDropdownRef.current.contains(event.target)) {
        setIsPetSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-24 w-full px-6 md:px-12 flex items-center justify-between z-40 flex-shrink-0 pt-4">
      {/* Botón de Configuración */}
      <button 
        onClick={onConfigClick} 
        className="w-12 h-12 rounded-full bg-[#3aaba5] flex items-center justify-center text-white shadow-md hover:bg-[#2d9b96] hover:scale-105 transition-all duration-300 border-2 border-white/50 group"
        title="Configuración"
      >
        <div className="animate-[spin_15s_linear_infinite] group-hover:animate-none">
          <SettingsIcon />
        </div>
      </button>

      {/* Selector de Mascota */}
      <div className="relative" ref={petDropdownRef}>
        <button 
          onClick={() => setIsPetSelectorOpen(!isPetSelectorOpen)} 
          className="flex items-center gap-3 bg-[#2d9b96] py-2 px-4 rounded-full shadow-lg hover:bg-[#23807c] transition-colors border-2 border-white/20"
        >
          <div className="w-8 h-8 rounded-full bg-[#5fc4b8] flex items-center justify-center text-lg border-2 border-white">
            {activePet.realAvatar}
          </div>
          <span className="font-bold text-white text-lg pr-2">{activePet.name}</span>
        </button>

        {isPetSelectorOpen && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mis Mascotas</span>
            </div>
            <ul className="py-2">
              {pets.map(pet => (
                <li key={pet.id}>
                  <button 
                    onClick={() => { setActivePetId(pet.id); setIsPetSelectorOpen(false); }} 
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${activePet.id === pet.id ? 'bg-[#5fc4b8]/10' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#5fc4b8]/20 flex items-center justify-center text-xl">
                      {pet.realAvatar}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-gray-800">{pet.name}</span>
                      <span className="text-xs text-gray-500">{pet.type}</span>
                    </div>
                    {activePet.id === pet.id && (
                      <div className="ml-auto animate-in zoom-in duration-300">
                        <CheckIcon />
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 border-t border-gray-100">
              <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-[#2d9b96] font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                <span className="text-lg leading-none">+</span> Añadir mascota
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
