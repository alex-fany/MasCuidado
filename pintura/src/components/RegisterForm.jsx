import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import { useSettings } from "../context/SettingsContext"

export default function RegisterForm({onLoginClick}) {
  const { t, language } = useSettings();
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.error?.includes("registrado")) throw new Error(t('err_email_taken'));
        if (data.error?.includes("campos")) throw new Error(t('err_required_fields'));
        throw new Error(data.error || t('err_generic'));
      }

      onLoginClick()

    } catch (err) {
      setError(err.message === "Failed to fetch" ? t('err_server') : err.message)
    } finally {
      setIsLoading(false)
    }
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
