import React from 'react';

export default function BottomNav({ navItems, currentView, onNavigate, onUserClick }) {
  return (
    <footer className="w-full flex justify-center z-40 flex-shrink-0 px-4 pb-4">
      <div className="w-full max-w-3xl relative">
        
        {/* Nav Principal */}
        <nav className="w-full bg-[#bcedea]/95 backdrop-blur-xl rounded-[2.5rem] p-2 flex items-center justify-between relative shadow-[0_20px_50px_-20px_rgba(45,155,150,0.4)] border-2 border-white/40">
          
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const isHome = item.label === "Home";
            const isProfile = item.label === "Perfil";

            if (isHome) {
              return (
                <div key={item.id} className="relative flex-1 flex justify-center">
      
                  <div className="absolute -top-18 w-28 h-24 bg-[#bcedea]/95 backdrop-blur-xl rounded-t-[3.5rem] border-t-2 border-x-2 border-white/40 -z-10 shadow-[-10px_-10px_30px_-15px_rgba(0,0,0,0.05),10px_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                    {/* Este div crea la ilusión de que la barra sube pa' que se vea bien chido */}
                  </div>

                  {/* Botón Home */}
                  <div className={`absolute -top-16 w-24 h-24 rounded-full transition-all duration-700 flex items-center justify-center 
                    ${isActive ? 'scale-110' : 'scale-100'}`}>
                  
                    {isActive && (
                      <div className="absolute inset-2 rounded-full bg-[#2d9b96] opacity-20 blur-xl"></div>
                    )}
                    
                    <button 
                      onClick={() => onNavigate(item.id)}
                      className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-4 relative z-10 group
                        ${isActive 
                          ? 'bg-[#2d9b96] text-white border-white shadow-[0_15px_40px_-5px_rgba(45,155,150,0.6)]' 
                          : 'bg-white text-[#2d9b96] border-[#bcedea] hover:border-[#2d9b96] shadow-xl'}`}
                    >
                      <div className="group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                    </button>
                  </div>
                  {/* Espaciador central */}
                  <div className="w-20"></div>
                </div>
              );
            }

            const handleClick = isProfile ? onUserClick : () => onNavigate(item.id);

            return (
              <button 
                key={item.id} 
                onClick={handleClick}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-3xl transition-all duration-300 relative group
                  ${isActive ? 'text-[#1a5d5a]' : 'text-[#2d9b96] hover:bg-[#2d9b96]/10'}`}
              >
                
                <div className={`absolute inset-x-2 h-12 rounded-2xl transition-all duration-500 -z-10
                  ${isActive ? 'bg-[#2d9b96]/20 opacity-100 scale-100' : 'bg-transparent opacity-0 scale-90'}`}>
                </div>

                <div className={`transition-all duration-300 flex flex-col items-center
                  ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:-translate-y-1'}`}>
                  {item.icon}
                  <div className={`w-1 h-1 rounded-full bg-[#2d9b96] mt-1 transition-all duration-500
                    ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
