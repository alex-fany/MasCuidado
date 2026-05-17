import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import { useSettings } from "../context/SettingsContext"

export default function ForgotPasswordForm({onLoginClick}) {
  const { t } = useSettings();
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulación de envío
    setTimeout(() => {
      setIsLoading(false)
      setSent(true)
    }, 1500)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <div className="space-y-1 mb-2">
          <h1 className="text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-xl font-black text-center text-[var(--brand-text)] opacity-60 uppercase tracking-widest italic leading-none">{t('forgot_title')}</h2>
        </div>

        {sent ? (
          <div className="bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/20 p-6 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in duration-500">
            <div className="w-14 h-14 bg-[var(--brand-primary)] rounded-full mx-auto flex items-center justify-center text-[var(--brand-button-text)] text-2xl shadow-lg shadow-[var(--brand-primary)]/20">✓</div>
            <p className="text-[var(--brand-text)] font-black text-xs uppercase tracking-widest italic leading-relaxed">
              {t('forgot_sent_desc')}
            </p>
            <Button onClick={onLoginClick} className="py-3">
              {t('forgot_sent_back')}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--brand-text)] opacity-60 text-center px-4 leading-relaxed font-black uppercase tracking-widest italic">
              {t('forgot_instructions')}
            </p>

            <Input
              label={t('form_email')}
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />

            <Button type="submit" loading={isLoading} className="py-4 shadow-xl shadow-[var(--brand-primary)]/20">
              {t('forgot_button')}
            </Button>

            <button
              type="button"
              className="text-[var(--brand-primary)] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-all flex items-center justify-center gap-1 group italic"
              onClick={onLoginClick}
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> {t('forgot_back')}
            </button>
          </>
        )}

      </form>
    </div>
  )
}
