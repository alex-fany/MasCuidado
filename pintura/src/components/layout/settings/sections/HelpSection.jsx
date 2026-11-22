import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import { useSettings } from '../../../../context/SettingsContext';

export default function HelpSection({ onReplay }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const { language } = useSettings();
  const text = language === 'en'
    ? ['Guided tutorials', 'Each tutorial appears the first time its screen or tool becomes available.', 'Replay tutorials', 'Tutorials will appear again as you open each screen. Progress is saved in your account across devices.']
    : language === 'pt'
      ? ['Tutoriais guiados', 'Cada tutorial aparece na primeira vez que a tela ou ferramenta fica disponível.', 'Repetir tutoriais', 'Os tutoriais aparecerão novamente ao abrir cada tela. O progresso é salvo na sua conta entre dispositivos.']
      : ['Tutoriales guiados', 'Cada tutorial aparece la primera vez que su pantalla o herramienta está disponible.', 'Repetir tutoriales', 'Volverán a aparecer conforme abras cada pantalla. El progreso se guarda en tu cuenta y se conserva entre dispositivos.'];
  return <SectionWrapper><section className="space-y-4 py-3 text-[var(--brand-text)]">
    <h3 className="font-black text-[var(--brand-primary)]">{text[0]}</h3>
    <p className="text-sm leading-relaxed">{text[1]}</p>
    <button type="button" disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try { await onReplay(); } catch { setError(true); setBusy(false); }
    }} className="w-full p-4 rounded-2xl bg-[var(--brand-primary)] text-[var(--brand-button-text)] font-black">{text[2]}</button>
    {busy && <p role="status">{language === 'en' ? 'Saving…' : language === 'pt' ? 'Salvando…' : 'Guardando…'}</p>}
    {error && <p role="alert">{language === 'en' ? 'Could not reset tutorials. Please try again.' : language === 'pt' ? 'Não foi possível reiniciar. Tente novamente.' : 'No se pudieron reiniciar los tutoriales. Inténtalo de nuevo.'}</p>}
    <p className="text-xs leading-relaxed opacity-70">{text[3]}</p>
  </section></SectionWrapper>;
}
