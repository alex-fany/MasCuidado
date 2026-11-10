import { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useSettings } from '../../../../context/SettingsContext';
import { backupMessages } from '../../../../constants/backupMessages';
import { exportPetBackup, importPetBackup, readBackupPreview } from '../../../../utils/petBackup';
import SectionWrapper from '../SectionWrapper';

function Metrics({ metrics, text }) {
  return <dl className="grid grid-cols-2 gap-2 text-center">
    {Object.entries(text.metrics).map(([key, label]) => <div key={key} className="flex flex-col p-2.5 bg-[var(--brand-surface-muted)] rounded-2xl border border-[var(--brand-border)]">
      <dt className="order-2 text-[10px] font-bold text-[var(--brand-text)] opacity-70 leading-tight">{label}</dt>
      <dd className="order-1 text-base font-black text-[var(--brand-primary)]">{Number.isInteger(metrics?.[key]) ? metrics[key] : text.unknown}</dd>
    </div>)}
  </dl>;
}

function Warnings({ codes = [], text }) {
  if (!codes.length) return null;
  return <div className="p-3 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded-2xl text-left">
    <p className="font-black text-xs text-[var(--brand-primary)] mb-2">{text.warningTitle}</p>
    <ul className="list-disc pl-4 space-y-2 text-xs font-semibold text-[var(--brand-text)] break-words">
      {codes.map(code => <li key={code}>{Object.hasOwn(text.warnings, code) ? text.warnings[code] : code}</li>)}
    </ul>
  </div>;
}

export default function BackupSection({ pets = [], activePetId, onPetImported, onBusyChange }) {
  const { language } = useSettings();
  const text = backupMessages[language] || backupMessages.es;
  const [tab, setTab] = useState('export');
  const [selectedPetId, setSelectedPetId] = useState(activePetId || '');
  const [selection, setSelection] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [operation, setOperation] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [uncertainImport, setUncertainImport] = useState(false);
  const fileInputRef = useRef(null);
  const operationRef = useRef(false);
  const mounted = useRef(true);
  const busy = operation !== '';
  const selectedPet = pets.find(pet => pet.id === selectedPetId) || pets.find(pet => pet.id === activePetId) || pets[0];

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onBusyChange?.(false); };
  }, [onBusyChange]);

  const begin = kind => {
    if (operationRef.current) return false;
    operationRef.current = true;
    setOperation(kind); setFeedback(null); onBusyChange?.(true);
    return true;
  };
  const finish = () => {
    operationRef.current = false;
    if (mounted.current) { setOperation(''); onBusyChange?.(false); }
  };
  const showError = (error, importing = false) => {
    setFeedback({ type: 'error', message: error.server ? error.message : (Object.hasOwn(text.errors, error.code) ? text.errors[error.code] : text.errors.UNEXPECTED_RESPONSE),
      uncertain: importing && error.uncertain, cleanupRequired: error.cleanupRequired, attemptId: error.attemptId });
    if (importing) { setConfirmed(false); setUncertainImport(Boolean(error.uncertain)); }
  };
  const sameSession = token => {
    if (localStorage.getItem('token') === token) return true;
    setFeedback({ type: 'error', message: text.sessionChanged }); return false;
  };

  const handleExport = async () => {
    if (!selectedPet || !begin('export')) return;
    try {
      const token = localStorage.getItem('token');
      const result = await exportPetBackup(selectedPet.id, token);
      if (!mounted.current || !sameSession(token)) return;
      const objectUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      try {
        anchor.href = objectUrl; anchor.download = result.filename;
        document.body.appendChild(anchor); anchor.click();
      } finally {
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
      setFeedback({ type: 'success', message: text.downloaded, warnings: result.preview.warnings });
    } catch (error) { if (mounted.current) showError(error); }
    finally { finish(); }
  };

  const handleFileChange = async event => {
    const file = event.target.files?.[0];
    if (!file || !begin('read')) return;
    setSelection(null); setConfirmed(false); setUncertainImport(false);
    try {
      const preview = await readBackupPreview(file);
      if (mounted.current) setSelection({ file, preview });
    } catch (error) {
      if (mounted.current) { showError(error); if (fileInputRef.current) fileInputRef.current.value = ''; }
    } finally { finish(); }
  };

  const handleImport = async event => {
    event.preventDefault();
    if (!selection || !confirmed || uncertainImport || !begin('import')) return;
    try {
      const token = localStorage.getItem('token');
      const result = await importPetBackup(selection.file, token);
      if (!mounted.current || !sameSession(token)) return;
      // Un fallo al actualizar la pantalla no convierte un POST exitoso en una importación fallida.
      // Primero se limpia el archivo seleccionado; el POST nunca se repite automáticamente.
      setSelection(null); setConfirmed(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', message: result.message, warnings: result.warnings, metrics: result.counts,
        incomplete: result.incomplete, imagesPending: result.imagesPending });
      let refreshed;
      try { refreshed = await onPetImported?.(result.mascota); }
      catch { refreshed = { refreshWarning: true }; }
      if (mounted.current && sameSession(token) && refreshed?.refreshWarning) {
        setFeedback(previous => ({ ...previous, refreshWarning: true }));
      }
    } catch (error) { if (mounted.current) showError(error, true); }
    finally { finish(); }
  };

  const clearFile = () => {
    if (operationRef.current) return;
    setSelection(null); setConfirmed(false); setFeedback(null); setUncertainImport(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const buttonClass = 'w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 bg-[var(--brand-primary)] text-[var(--brand-button-text)] hover:bg-[var(--brand-secondary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none';

  return <SectionWrapper>
    <section className="flex flex-col gap-4 pb-6 text-left" aria-busy={busy}>
      <div className="flex p-1.5 bg-[var(--brand-surface-muted)] rounded-2xl border border-[var(--brand-border)]" role="group">
        {['export', 'import'].map(item => <button key={item} type="button" disabled={busy} aria-pressed={tab === item}
          onClick={() => { if (!operationRef.current) setTab(item); }}
          className={'flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ' + (tab === item ? 'bg-[var(--brand-primary)] text-[var(--brand-button-text)] shadow-md' : 'text-[var(--brand-text)] opacity-60')}>
          {item === 'export' ? '💾 ' + text.exportTab : '📥 ' + text.importTab}
        </button>)}
      </div>

      {busy && <p role="status" className="text-xs font-black text-[var(--brand-primary)] animate-pulse text-center">{operation === 'read' ? text.reading : operation === 'export' ? text.exporting : text.importing}</p>}
      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} aria-live="polite" className="space-y-3">
        <div className={'p-4 rounded-2xl text-xs font-bold border break-words ' + (feedback.type === 'error' ? 'bg-[var(--brand-danger-muted)] text-[var(--brand-danger)] border-[var(--brand-danger)]/20' : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30')}>
          <p>{feedback.message}</p>
          {feedback.uncertain && <p className="mt-2">{text.unknownResult}</p>}
          {feedback.cleanupRequired && <p className="mt-2">{text.cleanup}</p>}
          {feedback.attemptId && <p className="mt-2">{text.attempt}: {feedback.attemptId}</p>}
          {feedback.refreshWarning && <p className="mt-2">{text.refreshWarning}</p>}
          {(feedback.incomplete || feedback.imagesPending) && <p className="mt-2">{text.incomplete}</p>}
        </div>
        <Warnings codes={feedback.warnings} text={text} />
        {feedback.metrics && <><p className="font-black text-xs text-[var(--brand-primary)]">{text.importedCounts}</p><Metrics metrics={feedback.metrics} text={text} /></>}
      </div>}

      {tab === 'export' ? <Motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="p-4 bg-[var(--brand-surface)]/60 rounded-3xl border border-[var(--brand-border)] space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--brand-primary)]">{text.selectPet}</p>
          {pets.length ? pets.map(pet => <button key={pet.id} type="button" disabled={busy} aria-pressed={selectedPet?.id === pet.id}
            onClick={() => setSelectedPetId(pet.id)}
            className={'w-full flex items-center gap-3.5 p-3 rounded-2xl border-2 text-left transition-all disabled:opacity-50 ' + (selectedPet?.id === pet.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10' : 'border-transparent bg-[var(--brand-surface-muted)]')}>
            <span className="w-10 h-10 rounded-xl bg-[var(--brand-surface)] flex items-center justify-center text-xl overflow-hidden shrink-0">
              {pet.imagen ? <img src={pet.imagen} alt="" className="w-full h-full object-cover" /> : (pet.realAvatar || '🐾')}
            </span>
            <span className="min-w-0 flex-1"><span className="block font-black text-sm text-[var(--brand-text)] truncate">{pet.nombre}</span><span className="text-[10px] font-bold text-[var(--brand-text)] opacity-60">{pet.tipo} {pet.raza}</span></span>
            {selectedPet?.id === pet.id && <span className="text-[var(--brand-primary)] font-black">✓</span>}
          </button>) : <p className="text-xs font-bold text-[var(--brand-text)] opacity-70 py-3">{text.noPets}</p>}
        </div>
        <p className="text-xs text-[var(--brand-text)] opacity-70 font-semibold leading-relaxed">{text.exportDesc}</p>
        <button type="button" disabled={!selectedPet || busy} onClick={handleExport} className={buttonClass}>{text.download}</button>
      </Motion.div> : <Motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <input ref={fileInputRef} type="file" accept=".json,application/json" disabled={busy} onChange={handleFileChange} className="hidden" aria-label={text.file} />
        {!selection ? <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()}
          className="w-full p-7 border-2 border-dashed border-[var(--brand-primary)]/40 rounded-3xl bg-[var(--brand-surface-muted)]/50 hover:bg-[var(--brand-primary)]/5 disabled:opacity-50 text-center">
          <span className="block text-3xl mb-3">📁</span><span className="block font-black text-sm text-[var(--brand-primary)]">{text.file}</span>
          <span className="block mt-2 text-[11px] font-semibold text-[var(--brand-text)] opacity-60">{text.fileHint}</span>
        </button> : <form onSubmit={handleImport} className="p-4 bg-[var(--brand-surface)] rounded-3xl border-2 border-[var(--brand-primary)]/30 space-y-4 shadow-sm">
          <div className="flex justify-between gap-3 items-center">
            <h3 className="font-black text-xs text-[var(--brand-primary)]">{text.preview}</h3>
            <button type="button" disabled={busy} onClick={clearFile} className="text-[10px] font-black text-[var(--brand-danger)] underline disabled:opacity-40">{text.otherFile}</button>
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">🐾</span>
            <div className="min-w-0"><h4 className="font-black text-lg text-[var(--brand-text)] break-words">{selection.preview.name}</h4>
              <p className="text-xs text-[var(--brand-text)] opacity-70 break-words">{selection.preview.petType} {selection.preview.breed}</p>
              {selection.preview.speciesName && <p className="text-xs text-[var(--brand-text)] opacity-70">{text.species}: {selection.preview.speciesName}</p>}
              <p className="text-[10px] font-bold text-[var(--brand-primary)] mt-1">{text.version} v{selection.preview.version} · {(selection.file.size / (1024 * 1024)).toFixed(2)} MiB</p>
            </div>
          </div>
          <Metrics metrics={selection.preview.metrics} text={text} />
          <Warnings codes={selection.preview.warnings} text={text} />
          <p className="text-[11px] font-semibold text-[var(--brand-text)] opacity-60">{text.preliminary}</p>
          <p className="p-3 bg-[var(--brand-primary)]/10 rounded-2xl text-xs font-bold text-[var(--brand-primary)]">{text.independent}</p>
          <label className="flex gap-3 items-start text-xs font-bold text-[var(--brand-text)] cursor-pointer">
            <input type="checkbox" checked={confirmed} disabled={busy || uncertainImport} required onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 accent-[var(--brand-primary)] shrink-0" />
            <span>{text.confirm}</span>
          </label>
          <button type="submit" disabled={busy || !confirmed || uncertainImport} className={buttonClass}>{text.importButton}</button>
        </form>}
      </Motion.div>}
      <p className="text-[10px] font-semibold text-[var(--brand-text)] opacity-60 leading-relaxed">{text.privacy}</p>
    </section>
  </SectionWrapper>;
}
