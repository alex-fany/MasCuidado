export default function Card({ children, className = "", style = {} }) {
  return (
    <div 
      className={`
        shadow-lg 
        rounded-[2.5rem] 
        p-4 sm:p-5 md:p-6 lg:p-8
        w-full 
        mx-auto
        transition-all 
        duration-300
        hover:shadow-xl
        border border-[var(--brand-border)]
        ${className}
      `}
      style={{ 
        background: 'var(--brand-modal-gradient)',
        ...style 
      }}
    >
      {children}
    </div>
  )
}
