/** Pausa quando a aba fica oculta ou a janela perde o foco (alt-tab). */
export function installAutoPause(doc: Document, onPause: () => void, win?: Pick<Window, 'addEventListener'>): void {
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) onPause(); });
  win?.addEventListener('blur', () => onPause());
}
