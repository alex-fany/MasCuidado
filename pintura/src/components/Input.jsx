export default function Input({ label, type = "text", placeholder, value, onChange, required = false, error = false }) {
  return (
    <div className="flex flex-col gap-1.5 w-full group">
      {label && (
        <label className={`text-xs font-bold uppercase tracking-widest ml-1 transition-colors duration-300 ${error ? 'text-red-500' : 'text-[#4b5563] group-focus-within:text-[#2d9b96]'}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-5 py-3.5 rounded-2xl border-2 bg-white/70 backdrop-blur-sm
          text-[#1f2937] font-medium placeholder:text-gray-400/80
          focus:outline-none focus:bg-white
          transition-all duration-300 shadow-sm
          ${error 
            ? 'border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
            : 'border-transparent focus:border-[#2d9b96] focus:ring-4 focus:ring-[#2d9b96]/10'}
        `}
      />
    </div>
  )
}
