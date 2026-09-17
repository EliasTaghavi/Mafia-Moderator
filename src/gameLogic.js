import { ROLES } from './roles';

// درهم‌ریختن آرایه (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ساخت لیست نقش‌ها بر اساس تعداد هرکدام، سپس توزیع تصادفی بین بازیکنان
export function distributeRoles(playerNames, roleCounts) {
  const roleBag = [];
  Object.entries(roleCounts).forEach(([roleId, count]) => {
    for (let i = 0; i < count; i++) roleBag.push(roleId);
  });

  if (roleBag.length !== playerNames.length) {
    throw new Error(
      `تعداد نقش‌ها (${roleBag.length}) با تعداد بازیکنان (${playerNames.length}) برابر نیست.`
    );
  }

  const shuffledRoles = shuffle(roleBag);

  return playerNames.map((name, idx) => ({
    id: `p${idx}-${Date.now()}`,
    name,
    roleId: shuffledRoles[idx],
    alive: true,
    toughUsed: false,
  }));
}

// تیمِ نمایش‌داده‌شده به کارآگاه: پدرخوانده به‌عنوان شهروند دیده می‌شود
export function apparentTeamForDetective(roleId) {
  if (roleId === 'godfather') return 'citizen';
  return ROLES[roleId]?.team ?? 'citizen';
}

// بررسی برد یکی از تیم‌ها بر اساس وضعیت زنده/مرده‌ی بازیکنان
export function checkWinner(players) {
  const alive = players.filter((p) => p.alive);
  const mafiaAlive = alive.filter((p) => ROLES[p.roleId].team === 'mafia').length;
  const citizenAlive = alive.filter((p) => ROLES[p.roleId].team === 'citizen').length;
  if (mafiaAlive === 0) return 'citizen';
  if (mafiaAlive >= citizenAlive) return 'mafia';
  return null;
}

/**
 * محاسبه‌ی نتیجه‌ی نهایی یک شب
 * actions: { mafiaTeamTargetId, sniperTargetId, doctorTargetId, detectiveTargetId }
 * players: آرایه‌ی فعلی بازیکنان (alive/roleId/toughUsed)
 * خروجی: { deaths: [{playerId, name, cause}], toughSaved: {playerId,name} | null, updatedPlayers }
 */
export function resolveNight(players, actions) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const pendingDeaths = new Map(); // playerId -> cause

  const { mafiaTeamTargetId, sniperTargetId, doctorTargetId } = actions;

  // ۱. نتیجه‌ی تک‌تیرانداز
  let sniperPlayer = null;
  if (sniperTargetId) {
    sniperPlayer = players.find((p) => p.roleId === 'sniper' && p.alive);
    const target = byId[sniperTargetId];
    if (target) {
      if (ROLES[target.roleId]?.team === 'mafia') {
        pendingDeaths.set(target.id, 'شلیک دقیق تک‌تیرانداز');
      } else if (sniperPlayer) {
        pendingDeaths.set(sniperPlayer.id, 'اشتباه تک‌تیرانداز (هدف اشتباه)');
      }
    }
  }

  // ۲. قربانی مافیا
  let toughSaved = null;
  if (mafiaTeamTargetId) {
    const target = byId[mafiaTeamTargetId];
    if (target) {
      pendingDeaths.set(target.id, 'حمله‌ی شبانه‌ی مافیا');
    }
  }

  // ۳. نجات دکتر: هر کسی که دکتر انتخاب کرده از هر نوع مرگی امشب در امان است
  if (doctorTargetId && pendingDeaths.has(doctorTargetId)) {
    pendingDeaths.delete(doctorTargetId);
  }

  // ۴. سپر جان‌سخت (فقط در برابر حمله‌ی مستقیم مافیا و فقط یک‌بار در کل بازی)
  if (
    mafiaTeamTargetId &&
    pendingDeaths.has(mafiaTeamTargetId) &&
    byId[mafiaTeamTargetId]?.roleId === 'tough' &&
    !byId[mafiaTeamTargetId]?.toughUsed
  ) {
    pendingDeaths.delete(mafiaTeamTargetId);
    toughSaved = { playerId: mafiaTeamTargetId, name: byId[mafiaTeamTargetId].name };
  }

  const deaths = [...pendingDeaths.entries()].map(([playerId, cause]) => ({
    playerId,
    name: byId[playerId]?.name,
    cause,
  }));

  const updatedPlayers = players.map((p) => {
    if (pendingDeaths.has(p.id)) {
      return { ...p, alive: false };
    }
    if (toughSaved && p.id === toughSaved.playerId) {
      return { ...p, toughUsed: true };
    }
    return p;
  });

  return { deaths, toughSaved, updatedPlayers };
}
