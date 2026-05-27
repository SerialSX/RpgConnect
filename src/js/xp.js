/**
 * Centralizador de Experiência (XP) do RPGConnect
 */

export const getXPKey = () => {
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!user) return null;
  const id = user.id || user.email || "anon";
  return `xp_${id}`;
};

export const addXP = (amount) => {
  const key = getXPKey();
  if (!key) return;

  const currentXP = parseInt(localStorage.getItem(key)) || 0;
  const oldLevel = Math.floor(currentXP / 100) + 1;
  const newXP = currentXP + amount;
  const newLevel = Math.floor(newXP / 100) + 1;
  
  localStorage.setItem(key, newXP.toString());
  
  // Dispara evento de XP
  window.dispatchEvent(new CustomEvent("xpUpdated", { detail: { amount, total: newXP } }));
  
  // Se subiu de nível, dispara evento de Level Up
  if (newLevel > oldLevel) {
    window.dispatchEvent(new CustomEvent("levelUp", { detail: { level: newLevel } }));
  }
  
  return newXP;
};

export const getLevelInfo = () => {
  const key = getXPKey();
  if (!key) return { xp: 0, level: 1, xpToNext: 100, progress: 0 };

  const xp = parseInt(localStorage.getItem(key)) || 0;
  
  // Sistema simples: cada 100 XP = 1 Nível
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;
  const progress = xpInCurrentLevel; // Pois o próximo nível é sempre +100
  
  return {
    xp,
    level,
    xpToNext: 100,
    progress
  };
};

/**
 * Retorna o nível de qualquer usuário baseado no seu ID/Email
 */
export const getUserLevel = (user) => {
  if (!user) return 1;
  const id = user.id || user.email || "anon";
  const xp = parseInt(localStorage.getItem(`xp_${id}`)) || 0;
  return Math.floor(xp / 100) + 1;
};

/**
 * Verifica bônus únicos (como o bônus de 3 jogos favoritos)
 */
export const checkUniqueBonus = (bonusId) => {
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!user) return true; // Pretend it's already claimed if no user
  
  const id = user.id || user.email || "anon";
  const bonusKey = `bonus_${bonusId}_${id}`;
  
  if (localStorage.getItem(bonusKey)) return true;
  
  return false;
};

export const claimUniqueBonus = (bonusId, amount) => {
  if (checkUniqueBonus(bonusId)) return;
  
  const user = JSON.parse(localStorage.getItem("usuarioLogado"));
  const id = user.id || user.email || "anon";
  const bonusKey = `bonus_${bonusId}_${id}`;
  
  localStorage.setItem(bonusKey, "true");
  addXP(amount);
};
