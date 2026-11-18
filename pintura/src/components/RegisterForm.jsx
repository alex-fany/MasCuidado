import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import { useSettings } from "../context/SettingsContext"

export default function RegisterForm({onLoginClick}) {
  const { t } = useSettings();
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.error?.includes("registrado")) throw new Error(t('err_email_taken') || "El correo ya está registrado");
        if (data.error?.includes("campos")) throw new Error(t('err_required_fields') || "Todos los campos son obligatorios");
        throw new Error(data.error || t('err_generic') || "Error al registrarse");
      }

      setRegisteredEmail(email)

    } catch (err) {
      setError(err.message === "Failed to fetch" ? (t('err_server') || "Error de conexión") : err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail })
      });
      const data = await res.json();
      setResendMessage(data.message || "Correo de verificación reenviado.");
    } catch {
      setResendMessage("Error al reenviar el correo.");
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 p-2 sm:p-4 text-center">
        <div className="space-y-4">
          <div className="space-y-1 mb-2">
            <h1 className="text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
            <h2 className="text-xs sm:text-sm font-black text-center text-gray-700/80 uppercase tracking-widest italic">
              ¡Casi listo!
            </h2>
          </div>

          <div className="bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/30 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full mx-auto flex items-center justify-center text-white text-3xl shadow-lg shadow-[var(--brand-primary)]/20">
              📩
            </div>
            <h3 className="text-base sm:text-lg font-black text-[var(--brand-primary)]">
              Verifica tu correo electrónico
            </h3>
            <p className="text-xs text-[var(--brand-text)] font-semibold leading-relaxed">
              Hemos enviado un enlace de activación a: <br />
              <strong className="text-[var(--brand-primary)] font-black text-sm">{registeredEmail}</strong>
            </p>
            <p className="text-[11px] text-[var(--brand-text)] opacity-70 leading-relaxed font-medium">
              Por favor revisa tu bandeja de entrada (y la carpeta de spam si es necesario) y haz clic en el enlace para activar tu cuenta antes de iniciar sesión.
            </p>

            {resendMessage && (
              <p className="text-[11px] font-black text-[var(--brand-primary)] bg-white/70 py-1.5 px-3 rounded-lg border border-[var(--brand-primary)]/20">
                {resendMessage}
              </p>
            )}

            <div className="space-y-2 pt-2">
              <Button onClick={onLoginClick} className="w-full py-3.5 shadow-lg shadow-[var(--brand-primary)]/20 text-xs uppercase tracking-wider font-black">
                Ir a Iniciar Sesión
              </Button>
              <button
                type="button"
                disabled={resending}
                onClick={handleResend}
                className="text-[11px] font-black text-[var(--brand-primary)] hover:underline opacity-80 hover:opacity-100 uppercase tracking-widest block mx-auto pt-1"
              >
                {resending ? "Reenviando..." : "¿No recibiste el correo? Reenviar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4 lg:gap-5 text-left">

        <div className="space-y-0.5 sm:space-y-1 mb-1">
          <h1 className="text-3xl sm:text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-sm sm:text-base font-black text-center text-gray-700/80 uppercase tracking-widest italic">{t('register_title')}</h2>
        </div>

        {error && (
          <div className="bg-[var(--brand-danger-muted)] border-2 border-[var(--brand-danger)]/10 p-3 sm:p-4 text-[var(--brand-danger)] text-xs sm:text-sm font-black rounded-2xl flex items-center gap-2 animate-shake">
            <span className="bg-[var(--brand-danger)] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">!</span>
            {error}
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          <Input
            label={t('form_name')}
            placeholder={t('ph_name')}
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
            error={!!error}
            maxLength={30}
          />

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
            {t('register_button')}
          </Button>
        </div>

        <button
          type="button"
          className="mt-4 text-[var(--brand-primary)] font-black text-xs tracking-widest bg-[var(--brand-surface-muted)] hover:bg-[var(--brand-primary)]/10 py-3 rounded-xl transition-all uppercase italic"
          onClick={onLoginClick}
        >
          {t('register_already_part')}
        </button>

      </form>
    </div>
  )
}
