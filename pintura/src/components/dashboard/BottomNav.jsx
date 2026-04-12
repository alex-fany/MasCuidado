import React from 'react';

export default function BottomNav({ navItems }) {
  return (
    <footer className="w-full flex justify-center z-40 flex-shrink-0 px-4 pb-4">
      <nav className="w-full max-w-3xl bg-[#bcedea]/90 backdrop-blur-md rounded-[2.5rem] p-2 flex items-center justify-between relative shadow-lg border-2 border-white/50">
        {navItems.map((item, index) => {
          if (item.label === "Home") {
            return (
              <div key={index} className="relative flex-1 flex justify-center h-full">
                {/* Botón Home sobresaliente */}
                <div className="absolute -top-10 w-24 h-24 bg-[#bcedea]/90 backdrop-blur-md rounded-full border-2 border-white/50 flex items-center justify-center shadow-lg">
                  <button className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center text-[#2d9b96] shadow-inner hover:bg-gray-50 transition-colors border-2 border-[#3aaba5]/20 group">
                    <div className="group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                  </button>
                </div>
                {/* Espacio para mantener el layout del flexbox */}
                <div className="w-20"></div>
              </div>
            );
          }
          
          return (
            <button 
              key={index} 
              className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-300 hover:bg-white/40 text-[#2d9b96] group"
            >
              <div className="opacity-70 group-hover:opacity-100 group-hover:-translate-y-1 transition-all">
                {item.icon}
              </div>
            </button>
          );
        })}
      </nav>
    </footer>
  );
}
