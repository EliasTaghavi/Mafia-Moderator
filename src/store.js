import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mafia-moderator-game-v1';

export const PHASES = {
  SETUP: 'setup',
  REVEAL: 'reveal',
  NIGHT: 'night',
  DAY: 'day',
};

export const DAY_STAGES = {
  NIGHT_RESULT: 'nightResult',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  RESULTS: 'results',
};

// نوع روز: کوری (قبل از شناخت مافیا) - بعد از شب معارفه - روز عادی بعد از هر شب واقعی
export const DAY_KINDS = {
  BLIND: 'blind',
  POST_INTRO: 'postIntro',
  REGULAR: 'regular',
};

// وضعیت اولیه‌ی مرحله‌ی روز؛ هر بار که شب تمام می‌شود دوباره ساخته می‌شود
export const freshDay = (kind = DAY_KINDS.REGULAR) => ({
  kind,
  stage: DAY_STAGES.NIGHT_RESULT,
  order: [], // ترتیب صحبت بازیکنان زنده در این دور روز
  turnIndex: 0,
  turnSubStage: 'challenge', // 'challenge' | 'speaking'
  challengedIds: [], // کسانی که در این دور روز قبلاً چالش گرفته‌اند
  challengeLog: [], // [{ fromName, toName }]
  votes: {}, // playerId -> تعداد رای
  eliminatedId: null,
  eliminatedName: null,
  tie: false,
});

// یک روز «کوری» یا «بعد از شب معارفه» که خبری از نتیجه‌ی شب ندارد و مستقیم بحث شروع می‌شود.
// روز کوری فقط صحبت دارد (بدون چالش و بدون رای‌گیری)، پس نوبت اول را مستقیم روی «صحبت» می‌گذاریم.
export const buildDiscussionDay = (players, kind) => ({
  ...freshDay(kind),
  stage: DAY_STAGES.DISCUSSION,
  order: players.filter((p) => p.alive).map((p) => p.id),
  turnSubStage: kind === DAY_KINDS.BLIND ? 'speaking' : 'challenge',
});

const emptyGame = () => ({
  phase: PHASES.SETUP,
  settings: {
    speakSeconds: 60, // زمان صحبت هر بازیکن در روز (ثانیه) - در صفحه‌ی تنظیمات تعیین می‌شود
    blindDayEnabled: false, // آیا «روز کوری» قبل از شب معارفه برگزار شود؟
  },
  players: [], // { id, name, roleId, alive, toughUsed }
  revealIndex: 0,
  nightNumber: 0,
  nightStepIndex: 0,
  nightActions: {}, // { mafiaTeamTargetId, sniperTargetId, doctorTargetId, detectiveTargetId }
  detectiveResult: null, // { name, team } shown to moderator only
  day: freshDay(),
  history: [], // [{ night, deaths: [{name, cause}], eliminatedByVote, votesTally }]
});

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyGame();
    const parsed = JSON.parse(raw);
    return { ...emptyGame(), ...parsed };
  } catch (e) {
    return emptyGame();
  }
}

function save(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch (e) {
    // ذخیره‌سازی ناموفق بود؛ بازی همچنان در حافظه‌ی موقت ادامه می‌یابد
    console.error('خطا در ذخیره‌سازی بازی', e);
  }
}

// یک هوک سراسری ساده برای اشتراک state بین کامپوننت‌ها بدون نیاز به Context جدا
let listeners = [];
let currentGame = load();

function setGame(updater) {
  const next = typeof updater === 'function' ? updater(currentGame) : updater;
  currentGame = next;
  save(currentGame);
  listeners.forEach((l) => l(currentGame));
}

export function useGame() {
  const [game, setLocalGame] = useState(currentGame);

  useEffect(() => {
    listeners.push(setLocalGame);
    return () => {
      listeners = listeners.filter((l) => l !== setLocalGame);
    };
  }, []);

  const update = useCallback((updater) => setGame(updater), []);

  const resetGame = useCallback(() => {
    currentGame = emptyGame();
    save(currentGame);
    listeners.forEach((l) => l(currentGame));
  }, []);

  return { game, update, resetGame };
}
