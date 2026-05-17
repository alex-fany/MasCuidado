import { useState, useEffect, useRef } from "react"
import Input from "./Input"
import Button from "./Button"
import { useSettings } from "../context/SettingsContext"

export default function LoginForm({onRegisterClick, onForgotClick, onLoginSuccess}) {
  const { t, language } = useSettings();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        // Mapeo de errores
        if (data.error?.includes("Credenciales")) throw new Error(t('err_invalid_creds'));
        if (data.error?.includes("campos")) throw new Error(t('err_required_fields'));
        throw new Error(t('err_invalid_creds'));
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message === "Failed to fetch" ? t('err_server') : err.message)
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
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(t('err_google_auth'))

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4 lg:gap-5">

        <div className="space-y-0.5 sm:space-y-1 mb-1">
          <h1 className="text-3xl sm:text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-sm sm:text-base font-bold text-center text-gray-700/80 uppercase tracking-widest italic">{t('login_subtitle')}</h2>
        </div>

        {error && (
          <div className="bg-[var(--brand-danger-muted)] border-2 border-[var(--brand-danger)]/10 p-2 sm:p-3 text-[var(--brand-danger)] text-[11px] sm:text-xs font-black rounded-xl flex items-center gap-2 animate-shake text-left">
            <span className="bg-[var(--brand-danger)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">!</span>
            {error}
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          <Input
            label={t('form_email')}
            type="email"
            placeholder={t('ph_email')}
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            error={!!error}
          />

          <Input
            label={t('form_password')}
            type="password"
            placeholder={t('ph_password')}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            error={!!error}
          />
        </div>

        <div className="space-y-3 mt-1">
          <Button type="submit" loading={isLoading} className="text-sm py-3 shadow-lg shadow-[var(--brand-primary)]/20">
            {t('login_button')}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--brand-primary)]/10"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]"><span className="bg-[var(--brand-modal-bg)] px-3 text-[var(--brand-text)] opacity-40">{language === 'en' ? 'or' : language === 'pt' ? 'ou' : 'o'}</span></div>
          </div>

          <div id="googleBtnContainer" className="w-full flex justify-center min-h-[40px] transform transition-all active:scale-[0.98]"></div>
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          <button
            type="button"
            className="text-[var(--brand-primary)] font-black text-xs tracking-widest bg-[var(--brand-surface-muted)] hover:bg-[var(--brand-primary)]/10 py-3 rounded-xl transition-all uppercase italic"
            onClick={onRegisterClick}
          >
            {t('login_no_account')}
          </button>

          <button
            type="button"
            className="text-[var(--brand-text)] opacity-40 hover:opacity-100 hover:text-[var(--brand-primary)] text-[10px] uppercase font-black tracking-widest transition-all italic"
            onClick={onForgotClick}
          >
            {t('login_forgot')}
          </button>
        </div>

      </form>
    </div>
  )
}
