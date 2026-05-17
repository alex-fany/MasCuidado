export default function Button({ children, type = "button", onClick, className = "", loading = false, disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative w-full py-3.5 px-6 rounded-2xl font-bold text-[var(--brand-button-text)] shadow-lg
        bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] active:scale-[0.97]
        transition-all duration-300 ease-out
        disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2 overflow-hidden
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-[var(--brand-button-text)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-90 tracking-wide">Procesando...</span>
        </>
      ) : (
        <span className="tracking-wide">{children}</span>
      )}
    </button>
  )
}
