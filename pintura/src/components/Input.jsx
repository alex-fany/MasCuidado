export default function Input({ label, name, type = "text", placeholder, value, onChange, required = false, error = false, disabled = false, className = "", maxLength }) {
  return (
    <div className={`flex flex-col gap-1.5 w-full group ${className}`}>
      {label && (
        <label className={`text-[10px] font-black uppercase italic ml-2 transition-colors duration-300 ${error ? 'text-red-500' : 'text-[var(--brand-primary)] group-focus-within:opacity-100 opacity-70'}`}>
          {label}
        </label>
      )}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={`
          w-full px-5 py-3.5 rounded-2xl border-2 bg-[var(--brand-surface-muted)]
          text-[var(--brand-text)] font-bold placeholder:text-[var(--brand-text)]/30
          focus:outline-none focus:bg-[var(--brand-surface)]
          transition-all duration-300 shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error 
            ? 'border-red-500/50 focus:border-red-500' 
            : 'border-transparent focus:border-[var(--brand-primary)]'}
        `}
      />
    </div>
  )
}
