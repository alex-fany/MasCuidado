export default function Button({children, onClick, type="button", className=""}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full shadow-lg bg-blue-600 py-2 rounded-lg hover:bg-blue-700 ring-1 ring-green-500/30 transition ${className}`}
    >
      {children}
    </button>
  )
}