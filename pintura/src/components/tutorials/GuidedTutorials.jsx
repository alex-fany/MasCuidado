import { useEffect, useRef, useState } from 'react';
import { Joyride, EVENTS, STATUS } from 'react-joyride';
import { useSettings } from '../../context/SettingsContext';
import { introductorySteps, windowMessages, viewMessages, detailedSteps } from './tutorialContent';
import { screenTutorial } from './tutorialState';

const visible = element => element && element.getClientRects().length > 0;

export default function GuidedTutorials({ userId, view, hasPets, loading }) {
  const { language } = useSettings();
  const [tour, setTour] = useState(null);
  const seen = useRef(null);
  const [notice, setNotice] = useState(false);
  const active = useRef(null);
  const shown = useRef(false);
  const failed = useRef(false);
  const offset = language === 'en' ? 2 : language === 'pt' ? 4 : 0;

  useEffect(() => {
    if (!userId || loading) return;
    const abort = new AbortController();
    fetch('/api/tutorials', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw new Error('progreso');
        const data = await response.json();
        if (!Array.isArray(data.seen) || data.seen.some(id => typeof id !== 'string')) throw new Error('formato');
        if (!abort.signal.aborted) seen.current = new Set(data.seen);
      }).catch(() => { if (!abort.signal.aborted) setNotice(true); });
    // Se espera a que terminen las transiciones. Los modales tienen prioridad sobre la pantalla.
    let candidate = null;
    let since = 0;
    const timer = window.setInterval(() => {
      if (!seen.current) return;
      const windows = [...document.querySelectorAll('[data-tour-window]')].filter(visible);
      const modal = windows.at(-1);
      const name = modal?.dataset.tourWindow;
      const section = modal?.dataset.tourSection;
      let key = modal ? (name === 'settings' && section !== 'main' ? (['theme', 'language'].includes(section) ? section : null) : name) : screenTutorial(view, hasPets);
      if (!modal && view === 'home' && !seen.current.has('welcome')) key = 'welcome';
      if (active.current) {
        if (active.current !== key) { active.current = null; setTour(null); }
        return;
      }
      if (!key || seen.current.has(key)) return;
      if (candidate !== key) { candidate = key; since = Date.now(); return; }
      if (Date.now() - since < 650) return;
      const scope = modal || document;
      const definitions = key === 'welcome'
        ? [...introductorySteps.welcome.map(([anchor, ...message]) => ({ anchor, message })), ...detailedSteps.welcome]
        : detailedSteps[key] || introductorySteps[key]?.map(([anchor, ...message]) => ({ anchor, message }));
      let steps;
      if (definitions) {
        steps = definitions.map(definition => {
          const target = scope.querySelector(`[data-tour-anchor="${definition.anchor}"]`);
          if (!visible(target)) return definition.optional ? null : false;
          const content = definition.mobile ? <>
            <span className="hidden lg:inline">{definition.message[offset + 1]}</span>
            <span className="lg:hidden">{definition.mobile[offset / 2]}</span>
          </> : definition.message[offset + 1];
          return { id: definition.anchor, target, title: definition.message[offset], content };
        });
        // Las fotos son opcionales; las demás referencias deben existir antes de iniciar.
        if (steps.includes(false)) return;
        steps = steps.filter(Boolean);
      } else {
        const selectors = {
          map: '[data-tour-view="map"]',
          backup: '[data-tour-window="backup"] [role="group"]',
          water: '[data-tour-anchor="water-confirm"]',
        };
        const message = windowMessages[key] || viewMessages[key];
        const target = selectors[key] && scope.querySelector(selectors[key]);
        if (!message || !visible(target)) return;
        steps = [{ target, title: message[offset], content: message[offset + 1] }];
      }
      steps = steps.map(step => ({ ...step,
        // En zonas extensas o con poca altura, el mensaje se centra y el resaltado conserva su objetivo.
        placement: window.innerHeight < 500 || step.target.getBoundingClientRect().height > window.innerHeight * 0.45 ? 'center' : 'auto',
        floatingOptions: { strategy: 'fixed' }, skipScroll: true,
        before: async () => {
          const rect = step.target.getBoundingClientRect();
          // scrollIntoView desplaza también los contenedores internos de los modales.
          step.target.scrollIntoView({ block: rect.height > window.innerHeight / 2 ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
          await new Promise(resolve => window.setTimeout(resolve, 300));
        },
      }));
      active.current = key;
      shown.current = false;
      failed.current = false;
      setTour({ key, steps });
    }, 200);
    return () => { abort.abort(); window.clearInterval(timer); };
  }, [userId, view, hasPets, loading, offset]);

  const warning = language === 'en' ? 'Tutorial progress could not be synchronized. Use Help → Replay tutorials to try again.' : language === 'pt' ? 'Não foi possível sincronizar os tutoriais. Use Ajuda → Repetir tutoriais para tentar novamente.' : 'No se pudo sincronizar el progreso de los tutoriales. Usa Ayuda → Repetir tutoriales para volver a intentarlo.';
  const banner = notice && <div role="status" className="fixed bottom-24 inset-x-4 z-[50001] p-3 rounded-2xl bg-[var(--brand-modal-bg)] text-[var(--brand-text)] shadow-xl text-sm"><p>{warning}</p><button type="button" onClick={() => setNotice(false)}>{language === 'en' ? 'Close' : language === 'pt' ? 'Fechar' : 'Cerrar'}</button></div>;
  if (!tour || loading) return banner;
  const locale = language === 'en'
    ? { back: 'Back', close: 'Close', last: 'Finish', next: 'Next', skip: 'Skip', nextWithProgress: 'Next ({current}/{total})' }
    : language === 'pt'
      ? { back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular', nextWithProgress: 'Próximo ({current}/{total})' }
      : { back: 'Anterior', close: 'Cerrar', last: 'Finalizar', next: 'Siguiente', skip: 'Omitir', nextWithProgress: 'Siguiente ({current}/{total})' };
  return <>{banner}<Joyride key={`${tour.key}:${language}`} run continuous scrollToFirstStep steps={tour.steps} locale={locale}
    options={{ skipBeacon: true, buttons: ['back', 'skip', 'close', 'primary'], showProgress: true,
      closeButtonAction: 'skip', overlayClickAction: false, blockTargetInteraction: true,
      zIndex: 50000, primaryColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-modal-bg)',
      textColor: 'var(--brand-text)', arrowColor: 'var(--brand-modal-bg)', overlayColor: '#061f20b8', targetWaitTimeout: 1500 }}
    styles={{ tooltip: { maxWidth: 'min(340px, calc(100vw - 32px))', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', borderRadius: 20, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' } }}
    onEvent={event => {
      if (event.type === EVENTS.TOOLTIP) shown.current = true;
      if ([EVENTS.TARGET_NOT_FOUND, EVENTS.ERROR].includes(event.type)) failed.current = true;
      if (event.type !== EVENTS.TOUR_END || ![STATUS.FINISHED, STATUS.SKIPPED].includes(event.status)) return;
      if (shown.current && !failed.current) {
        seen.current.add(tour.key);
        fetch(`/api/tutorials/${tour.key}`, { method: 'PUT', headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json',
        }, body: '{}' }).then(response => { if (!response.ok) setNotice(true); }).catch(() => setNotice(true));
      } else {
        // Evita repetir inmediatamente un recorrido fallido, sin guardarlo como visto.
        seen.current.add(tour.key);
      }
      active.current = null;
      setTour(null);
    }} /></>;
}
