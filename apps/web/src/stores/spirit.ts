import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SPIRIT_WORD_BANK } from '../data/wordBank';

export type SpiritHistoryItem = { text: string; at: number; trigger: 'manual' | 'auto' };

export const useSpiritStore = defineStore('spirit', () => {
  const currentWord = ref('');
  const wordVisible = ref(false);
  const autoMode = ref(true);
  const history = ref<SpiritHistoryItem[]>([]);
  const lastEmfAtTrigger = ref(0);

  function pickWord(seed: number): string {
    const idx = Math.abs(Math.floor(seed)) % SPIRIT_WORD_BANK.length;
    return SPIRIT_WORD_BANK[idx] ?? '静';
  }

  function revealWord(text: string, trigger: 'manual' | 'auto') {
    currentWord.value = text;
    wordVisible.value = false;
    requestAnimationFrame(() => {
      wordVisible.value = true;
    });
    const item: SpiritHistoryItem = { text, at: Date.now(), trigger };
    history.value = [item, ...history.value].slice(0, 20);
  }

  function manualCommunicate() {
    const seed = Date.now() ^ (Math.random() * 1e9);
    revealWord(pickWord(seed), 'manual');
  }

  /** 由 EMF 波动自动触发 */
  function tryAutoFromEmf(emfDisplay: number, prevEmf: number) {
    if (!autoMode.value) return;
    const delta = Math.abs(emfDisplay - prevEmf);
    if (delta >= 90 || emfDisplay > 480) {
      if (Date.now() - lastEmfAtTrigger.value < 2500) return;
      lastEmfAtTrigger.value = Date.now();
      revealWord(pickWord(emfDisplay * 1000 + delta * 17), 'auto');
    }
  }

  return {
    currentWord,
    wordVisible,
    autoMode,
    history,
    manualCommunicate,
    tryAutoFromEmf,
    pickWord,
  };
});
