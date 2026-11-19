import { validateAuthFields } from '../utils/formValidation';
import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import { useSettings } from "../context/SettingsContext"

export default function ForgotPasswordForm({onLoginClick}) {
  const { t, language } = useSettings();
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    const errors = validateAuthFields('forgot', { email }, language);
    if (errors.email) { setEmailError(errors.email); return; }

    try {
      setIsLoading(true);

      const res = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.field === 'email') setEmailError(data.error);
        throw new Error(data.error || "Error al enviar correo");
      }

      setSent(true);

    } catch (err) {
      console.error(err);
      setError(err.message || "Error al enviar correo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

        <div className="space-y-1 mb-2">
          <h1 className="text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-xl font-black text-center text-[var(--brand-text)] opacity-60 uppercase tracking-widest italic leading-none">{t('forgot_title')}</h2>
        </div>

        {error && !emailError && (
          <div className="bg-[var(--brand-danger-muted)] border-2 border-[var(--brand-danger)]/10 p-3 text-[var(--brand-danger)] text-xs font-black rounded-2xl flex items-center gap-2 animate-shake text-left">
            <span className="bg-[var(--brand-danger)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0">!</span>
            <span>{error}</span>
          </div>
        )}

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
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              required
              error={emailError}
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
