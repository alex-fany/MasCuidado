import { useState } from "react"
import Input from "./Input"
import Button from "./Button"

export default function RegisterForm({onLoginClick}) {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al registrarse")

      onLoginClick()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">

        <div className="space-y-1 mb-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center text-[#2d9b96] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-base sm:text-lg font-bold text-center text-gray-700/80">Crea tu cuenta gratis</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-3 sm:p-4 text-red-600 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-2 animate-pulse">
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">!</span>
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Nombre"
            placeholder="nombre(s) apellido(s)"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <Input
            label="Tu Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" loading={isLoading} className="mt-2 py-3.5 sm:py-4">
          Registrarse
        </Button>

        <button
          type="button"
          className="mt-4 text-[#2d9b96] font-bold text-xs sm:text-sm tracking-wide bg-teal-50 hover:bg-teal-100 py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          onClick={onLoginClick}
        >
          ¿Ya tienes cuenta? <span className="underline">Inicia sesión aquí</span>
        </button>

      </form>
    </div>
  )
}
