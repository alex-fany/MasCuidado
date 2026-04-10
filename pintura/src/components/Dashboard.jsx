import Button from "./Button"

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/50 max-w-md w-full transform transition-all hover:scale-[1.01]">
        <h1 className="text-4xl font-extrabold text-[#2d9b96] mb-2 tracking-tight">+Cuidado</h1>
        <p className="text-gray-500 text-sm mb-8 uppercase tracking-widest font-semibold">Panel de Control</p>
        
        <div className="w-24 h-24 bg-gradient-to-br from-[#2d9b96] to-[#8dd9cc] rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
          {user?.nombre?.charAt(0) || "U"}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{user?.nombre}</h2>
        <p className="text-teal-600 font-medium mb-8 italic">{user?.correo}</p>
        
        <div className="p-5 bg-teal-50/50 rounded-2xl mb-10 border border-teal-100/50 text-teal-800 text-sm leading-relaxed shadow-inner">
          <span className="block font-bold mb-1">¡Sesión Iniciada!</span>
          Has accedido correctamente a tu cuenta. Ahora puedes gestionar todos los servicios de salud para tus mascotas.
        </div>

        <Button onClick={onLogout} className="w-full py-4 rounded-xl font-bold text-lg shadow-teal-200">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
