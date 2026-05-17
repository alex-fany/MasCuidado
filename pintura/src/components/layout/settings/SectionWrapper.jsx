import React from 'react';
import { motion } from 'framer-motion';

export default function SectionWrapper({ children, title, subtitle, onBack }) {
  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
        {children}
      </div>
    </motion.div>
  );
}
