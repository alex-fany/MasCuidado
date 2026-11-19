import { useSettings } from '../context/SettingsContext';
import { validateAuthFields, serverFieldErrors } from '../utils/formValidation';
import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

export default function ResetPassword({ token }) {
  const { language } = useSettings();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateClient = () => {
    const errs = validateAuthFields('reset', { password, confirmPassword }, language);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setMessage("");

    if (!validateClient()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFieldErrors(serverFieldErrors(data, ["password","confirmPassword"]));
        throw new Error(data.error || "Error al actualizar la contraseña");
      }

      setSuccess(true);
      setMessage(data.message || "¡Contraseña actualizada correctamente!");
      setTimeout(() => {
        window.location.href = "/";
      }, 2500);

    } catch (err) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 p-2 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1 mb-2">
          <h1 className="text-4xl font-black text-center text-[var(--brand-primary)] tracking-tighter drop-shadow-sm">+Cuidado</h1>
          <h2 className="text-sm font-black text-center text-[var(--brand-text)] opacity-70 uppercase tracking-widest italic leading-none">
            Restablecer Contraseña
          </h2>
        </div>

        {error && !Object.values(fieldErrors).some(Boolean) && (
          <div className="bg-[var(--brand-danger-muted)] border-2 border-[var(--brand-danger)]/10 p-3 text-[var(--brand-danger)] text-xs font-black rounded-2xl flex items-center gap-2 animate-shake text-left">
            <span className="bg-[var(--brand-danger)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0">!</span>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)]/30 p-6 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-full mx-auto flex items-center justify-center text-white text-3xl shadow-lg shadow-[var(--brand-primary)]/20">
              ✓
            </div>
            <h3 className="text-lg font-black text-[var(--brand-primary)]">¡Contraseña Guardada!</h3>
            <p className="text-xs text-[var(--brand-text)] font-semibold leading-relaxed">
              {message} <br />
              <span className="opacity-70">Redirigiéndote al inicio de sesión...</span>
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-left">
              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
              setError("");
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                required
                error={fieldErrors.password}
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
              setError("");
                  if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                required
                error={fieldErrors.confirmPassword}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-4 shadow-xl shadow-[var(--brand-primary)]/20 text-xs uppercase font-black tracking-wider"
            >
              Guardar Contraseña
            </Button>

            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-[var(--brand-primary)] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-all inline-block italic"
              >
                ← Volver al Login
              </a>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
