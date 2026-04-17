import React from 'react';

export default function BottomNav({ navItems, currentView, onNavigate, onUserClick }) {
  return (
    <footer className="w-full flex justify-center z-40 flex-shrink-0 px-4 pb-4">
      <nav className="w-full max-w-3xl bg-[#bcedea]/90 backdrop-blur-md rounded-[2.5rem] p-2 flex items-center justify-between relative shadow-lg border-2 border-white/50">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          
          if (item.label === "Home") {
            return (
              <div key={item.id} className="relative flex-1 flex justify-center h-full">
                {/* Botón Home */}
                <div className={`absolute -top-10 w-24 h-24 bg-[#bcedea]/90 backdrop-blur-md rounded-full border-2 border-white/50 flex items-center justify-center shadow-lg transition-transform duration-500 ${isActive ? 'scale-110' : ''}`}>
                  <button 
                    onClick={() => onNavigate(item.id)}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-inner transition-all duration-300 border-2 group ${isActive ? 'bg-[#2d9b96] text-white border-white/40' : 'bg-white text-[#2d9b96] border-[#3aaba5]/20 hover:bg-gray-50'}`}
                  >
                    <div className="group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                  </button>
                </div>
                {/* Espacio para mantener el layout del flexbox */}
                <div className="w-20"></div>
              </div>
            );
          }else if(item.label === "Perfil"){
            return (
            <button
              key={item.id}
              onClick={onUserClick}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-300 hover:bg-white/40 text-[#2d9b96] group"
            >
              <div className="opacity-70 group-hover:opacity-100 group-hover:-translate-y-1 transition-all">
                {item.icon}
              </div>
            </button>
          );
          }

          
          return (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/60 text-[#1a5d5a] shadow-sm' : 'hover:bg-white/40 text-[#2d9b96]'}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:-translate-y-1'}`}>
                {item.icon}
              </div>
            </button>
          );
        })}
      </nav>
    </footer>
  );
}
