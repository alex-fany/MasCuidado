import { useState, useEffect, useRef } from "react"
import Input from "./Input"
import Button from "./Button"

export default function LoginForm({onRegisterClick, onForgotClick, onLoginSuccess}) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const gsiInitialized = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión")

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    /* global google */
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        try {
          if (!window.__gsi_initialized) {
            google.accounts.id.initialize({
              client_id: "609963966526-rn76n1sdo1ve12niph6t0lqq575i94cm.apps.googleusercontent.com",
              callback: handleGoogleResponse,
              auto_select: false
            });
            window.__gsi_initialized = true;
          }

          const container = document.getElementById("googleBtnContainer");
          if (container) {
            container.innerHTML = "";
            google.accounts.id.renderButton(container, { 
              theme: "outline", 
              size: "large", 
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left"
            });
          }
        } catch (err) {
          console.error("Error Google Auth:", err);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [])

  const handleGoogleResponse = async (response) => {
    setError("");
    setIsLoading(true);
    
    try {
      const idToken = response.credential;
      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      onLoginSuccess(data.user);

    } catch (err) {
      setError("Error con Google: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4 lg:gap-5">

        <div className="space-y-0.5 sm:space-y-1 mb-1">
          <h1 className="text-3xl sm:text-4xl font-black text-center text-[#2d9b96] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-sm sm:text-base font-bold text-center text-gray-700/80 uppercase tracking-widest">Login</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-2 sm:p-3 text-red-600 text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-2">
            <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">!</span>
            {error}
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          <Input
            label="Email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            error={!!error}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            error={!!error}
          />
        </div>

        <div className="space-y-3 mt-1">
          <Button type="submit" loading={isLoading} className="text-sm py-3">
            Ingresar
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200/50"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-white px-3 text-gray-400">o</span></div>
          </div>

          <div id="googleBtnContainer" className="w-full flex justify-center min-h-[40px] transform transition-all active:scale-[0.98]"></div>
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          <button
            type="button"
            className="text-[#2d9b96] font-bold text-xs tracking-wide bg-teal-50/50 hover:bg-teal-100/80 py-2.5 rounded-xl transition-all"
            onClick={onRegisterClick}
          >
            ¿Sin cuenta? <span className="underline decoration-2">Regístrate aquí</span>
          </button>

          <button
            type="button"
            className="text-gray-400 hover:text-[#2d9b96] text-[10px] uppercase font-bold tracking-widest transition-colors"
            onClick={onForgotClick}
          >
            Recuperar contraseña
          </button>
        </div>

      </form>
    </div>
  )
}
