export function screenTutorial(view, hasPets) {
  if (view === 'home') return hasPets ? 'home' : 'welcome';
  if (['calendar', 'map'].includes(view) && !hasPets) return null;
  return ['calendar', 'map', 'profile', 'logros'].includes(view) ? view : null;
}
