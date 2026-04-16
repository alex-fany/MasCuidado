import { MapPinIcon } from '../common/Icons';

export default function MapView() {
  return (
    <section className="flex-1 w-full max-w-4xl mx-auto flex flex-col px-4 pt-0 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera de la vista */}
      <header className="mb-2 flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(45,155,150,0.4)] tracking-tight">
            Veterinarias
          </h2>
          <p className="text-[#3aaba5] font-bold text-sm">Cerca de tu ubicación</p>
        </div>
      </header>

      {/* Contenedor del Mapa */}
      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-[3rem] border-4 border-dashed border-[#3aaba5]/30 flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[400px] mb-32">
        
        {/* Elementos visuales acá bien padres */}
        <div className="flex flex-col items-center gap-6">
           <div className="p-8 bg-[#f0fdfa] rounded-full shadow-lg shadow-[#2d9b96]/10 animate-bounce-gentle border-2 border-white">
             <MapPinIcon />
           </div>
           
           <div className="text-center space-y-2">
             <h3 className="text-[#2d9b96] font-black text-2xl">Buscando clínicas...</h3>
             <p className="text-[#3aaba5] font-semibold max-w-[250px]">
               Estamos preparando el mapa para que encuentres la mejor atención.
             </p>
           </div>
        </div>
        
        {/* Botón flotante placeholder */}
        <div className="absolute bottom-8 right-8">
           <button className="w-16 h-16 bg-[#2d9b96] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white/30 group">
             <div className="group-hover:rotate-12 transition-transform">
               <MapPinIcon />
             </div>
           </button>
        </div>
      </div>
    </section>
  );
}
