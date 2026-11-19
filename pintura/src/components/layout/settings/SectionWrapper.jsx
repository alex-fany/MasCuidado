import React from 'react';
import { motion } from 'framer-motion';

export default function SectionWrapper({ children, title, subtitle, onBack }) {
  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex flex-col flex-1 min-h-0 w-full overflow-hidden"
    >
      {/* La altura se reparte con flex; el contenido largo tiene un único contenedor desplazable. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pt-2 pb-[max(3rem,env(safe-area-inset-bottom))] custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
}
