import { useEffect, useId, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { validationMessage } from '../utils/formValidation';

export default function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error = false,
  errorMessage = "",
  disabled = false,
  className = "",
  maxLength,
  min,
  suffix,
  id,
  step,
  max,
  minLength,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);
  const { language } = useSettings();
  const [nativeError, setNativeError] = useState('');

  const handleNumberChange = (e) => {
    e.currentTarget.setCustomValidity('');
    setNativeError('');
    onChange?.(e);
  };

  const hasError = Boolean(error || errorMessage || nativeError);
  const errorText = (typeof error === 'string' && error) || errorMessage || nativeError || (error ? validationMessage('invalid', language) : '');

  useEffect(() => {
    // Solo se lleva el foco al primer campo inválido del formulario.
    const input = inputRef.current;
    if (hasError && input?.form?.querySelector('[aria-invalid="true"]') === input) {
      input.focus();
      input.scrollIntoView({ block: 'nearest' });
    }
  }, [hasError]);

  return (
    <div className={`flex flex-col gap-1 w-full group ${className}`}>
      {label && (
        <label htmlFor={inputId} className={`text-[10px] font-black uppercase italic ml-2 transition-colors duration-300 ${hasError ? 'text-red-500' : 'text-[var(--brand-primary)] group-focus-within:opacity-100 opacity-70'}`}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleNumberChange}
          onInvalid={event => setNativeError(event.currentTarget.validationMessage || validationMessage('invalid', language))}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          max={max}
          step={step ?? (type === 'number' ? 'any' : undefined)}
          min={type === 'number' ? (min !== undefined ? min : 0) : undefined}
          className={`
            w-full px-5 py-3.5 rounded-2xl border-2 bg-[var(--brand-surface-muted)]
            text-[var(--brand-text)] font-bold placeholder:text-[var(--brand-text)]/30
            focus:outline-none focus:bg-[var(--brand-surface)]
            transition-all duration-300 shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${hasError
              ? 'border-red-500/60 focus:border-red-500 ring-2 ring-red-500/10'
              : 'border-transparent focus:border-[var(--brand-primary)]'}
            ${suffix ? 'pr-12' : ''}
          `}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--brand-text)] opacity-40 font-black text-[10px] uppercase">
            {suffix}
          </div>
        )}
      </div>
      {hasError && errorText && (
        <span id={`${inputId}-error`} role="alert" className="text-[11px] font-bold text-red-500 ml-2 mt-0.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 text-left">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">!</span>
          {errorText}
        </span>
      )}
    </div>
  )
}
