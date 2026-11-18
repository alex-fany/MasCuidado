import { useState, useEffect } from "react";
import Button from "./Button";
import { useSettings } from "../context/SettingsContext";

export default function VerifyEmail({ token, onGoToLogin }) {
  const { t } = useSettings();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Token de verificación no proporcionado.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "¡Tu correo ha sido verificado correctamente!");
        } else {
          setStatus("error");
          setMessage(data.error || "El enlace no es válido o ha expirado.");
          if (data.email) setEmailInput(data.email);
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Error de conexión al verificar el correo.");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e?.preventDefault();
    if (!emailInput) return;
    setResending(true);
    setResendStatus("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus("success");
        setMessage(data.message || "Se ha enviado un nuevo enlace a tu correo.");
      } else {
        setResendStatus("error");
        setMessage(data.error || "No se pudo reenviar el correo.");
      }
    } catch {
      setResendStatus("error");
      setMessage("Error al intentar reenviar el correo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 p-2 sm:p-4 text-center">
      <div className="space-y-4">
        <div className="space-y-1 mb-2">
          <h1 className="text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-base font-black text-center text-[var(--brand-text)] opacity-70 uppercase tracking-widest italic leading-none">
            Verificación de Cuenta
          </h2>
        </div>

        {status === "verifying" && (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-[var(--brand-text)] opacity-80">
              Verificando tu dirección de correo...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/30 p-6 rounded-[2.5rem] space-y-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full mx-auto flex items-center justify-center text-white text-3xl shadow-lg shadow-[var(--brand-primary)]/20">
              ✓
            </div>
            <h3 className="text-lg font-black text-[var(--brand-primary)]">¡Verificación Exitosa!</h3>
            <p className="text-xs text-[var(--brand-text)] font-semibold leading-relaxed">
              {message}
            </p>
            <div className="pt-2">
              <Button onClick={onGoToLogin} className="w-full py-3.5 shadow-lg shadow-[var(--brand-primary)]/20">
                Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-[var(--brand-danger-muted)] border-2 border-[var(--brand-danger)]/20 p-6 rounded-[2.5rem] space-y-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-[var(--brand-danger)] rounded-full mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg">
              ✕
            </div>
            <h3 className="text-base font-black text-[var(--brand-danger)]">No pudimos verificar tu correo</h3>
            <p className="text-xs text-[var(--brand-text)] font-semibold leading-relaxed">
              {message}
            </p>

            <form onSubmit={handleResend} className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-[var(--brand-text)] opacity-70">
                ¿Deseas que te enviemos un nuevo enlace?
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] text-xs font-bold text-[var(--brand-text)] placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
              <Button type="submit" loading={resending} className="w-full py-2.5 text-xs">
                Reenviar correo de verificación
              </Button>
            </form>

            <div className="pt-2 border-t border-[var(--brand-border-strong)]">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-[var(--brand-primary)] font-black text-xs uppercase tracking-widest hover:underline"
              >
                ← Volver al Inicio de Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
