import { useState } from "react"
import Input from "./Input"
import Button from "./Button"

export default function ForgotPasswordForm({onLoginClick}) {

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulación de envío pq todavía no sirve
    setTimeout(() => {
      console.log("Recuperar contraseña", email)
      setIsLoading(false)
      setSent(true)
    }, 1500)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <div className="space-y-1 mb-2">
          <h1 className="text-4xl font-black text-center text-[#2d9b96] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-xl font-bold text-center text-gray-700">Recuperar Acceso</h2>
        </div>

        {sent ? (
          <div className="bg-teal-50 border-2 border-teal-100 p-6 rounded-2xl text-center space-y-4 animate-in zoom-in duration-500">
            <div className="w-12 h-12 bg-[#2d9b96] rounded-full mx-auto flex items-center justify-center text-white text-xl">✓</div>
            <p className="text-teal-900 font-bold text-sm">
              Si el correo está registrado, recibirás las instrucciones en breve.
            </p>
            <Button onClick={onLoginClick} className="bg-teal-700">
              Volver al Inicio
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 text-center px-4 leading-relaxed font-medium">
              Ingresa tu correo electrónico y te enviaremos los pasos para restablecer tu contraseña.
            </p>

            <Input
              label="Correo Registrado"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />

            <Button type="submit" loading={isLoading}>
              Enviar Instrucciones
            </Button>

            <button
              type="button"
              className="text-[#2d9b96] font-bold text-xs uppercase tracking-widest hover:text-[#3aaba5] transition-all flex items-center justify-center gap-1 group"
              onClick={onLoginClick}
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al login
            </button>
          </>
        )}

      </form>
    </div>
  )
}
