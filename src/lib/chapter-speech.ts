import { t } from '../i18n/core';

type Reader = {
 root: HTMLElement;
 button: HTMLButtonElement;
 status: HTMLElement;
 label: string;
 text: () => string;
 stopOnViewExit?: boolean;
};

// The chapter brief keeps native speech state in sync with the active view.
export function initSpeechReader({ root, button, status, label, text, stopOnViewExit = false }: Reader) {
 if (!('speechSynthesis' in window)) {
  if (stopOnViewExit) status.textContent = t('Reading aloud is unavailable. You can read the idea above.');
  return;
 }
 let activeSpeech: SpeechSynthesisUtterance | null = null;
 const finish = () => { button.dataset.speaking = 'no'; button.textContent = t(label); };
 const stop = () => {
  activeSpeech = null;
  speechSynthesis.cancel();
  finish();
  status.textContent = t('Stopped.');
 };
 button.hidden = false;
 button.addEventListener('click', () => {
  if (button.dataset.speaking === 'yes') { stop(); return; }
  speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text());
  speech.lang = document.documentElement.lang === 'ar' ? 'ar-SA' : document.documentElement.lang;
  speech.rate = .85;
  speech.onend = () => {
   if (activeSpeech !== speech) return;
   activeSpeech = null; finish(); status.textContent = t('Finished.');
  };
  speech.onerror = () => {
   if (activeSpeech !== speech) return;
   activeSpeech = null; finish(); status.textContent = t('Reading aloud is unavailable. You can read the idea above.');
  };
  activeSpeech = speech;
  button.dataset.speaking = 'yes'; button.textContent = t('Stop reading');
  status.textContent = t('Reading the short idea.');
  speechSynthesis.speak(speech);
 });
 window.addEventListener('pagehide', () => {
  if (activeSpeech) stop(); else speechSynthesis.cancel();
 });
 if (stopOnViewExit) root.closest('.chapter-page')?.addEventListener('chapter-view-change', (event) => {
  if ((event as CustomEvent<string>).detail !== 'play' && activeSpeech) stop();
 });
}
