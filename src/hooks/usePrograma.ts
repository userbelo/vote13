import { useEffect, useReducer, useCallback, useRef } from 'react';
import type { Benefit, AppState } from '../types';
import { INITIAL_BENEFITS, INITIAL_MISSIONS, INITIAL_VAGAS, LEVEL_NAMES, XP_LEVELS } from '../constants';

// ── State & Actions ──────────────────────────────────────────────────────────

type Action =
  | { type: 'COMPLETE_MISSION'; id: number }
  | { type: 'SET_MISSION_PROGRESS'; id: number; progress: number }
  | { type: 'DECREMENT_VAGAS' };

const initialState: AppState = {
  xp: 0,
  level: 1,
  citizenPoints: 0,
  missions: INITIAL_MISSIONS.map(mission => ({ ...mission })),
  vagas: INITIAL_VAGAS,
};

function levelForXp(xp: number): number {
  let level = 1;
  while (level < 4 && xp >= XP_LEVELS[level]) level++;
  return level;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MISSION_PROGRESS': {
      return {
        ...state,
        missions: state.missions.map(mission =>
          mission.id === action.id && !mission.completed && !mission.locked
            ? { ...mission, progress: Math.max(0, Math.min(100, action.progress)) }
            : mission
        ),
      };
    }
    case 'COMPLETE_MISSION': {
      const missionIndex = state.missions.findIndex(mission => mission.id === action.id);
      const mission = state.missions[missionIndex];
      if (!mission || mission.completed || mission.locked) return state;

      const xp = state.xp + mission.points;
      const missions = state.missions.map((item, index) => {
        if (index === missionIndex) return { ...item, completed: true, progress: 100 };
        if (index === missionIndex + 1) return { ...item, locked: false };
        return item;
      });

      return {
        ...state,
        xp,
        level: levelForXp(xp),
        citizenPoints: state.citizenPoints + Math.round(mission.points * 0.8),
        missions,
      };
    }
    case 'DECREMENT_VAGAS': {
      return { ...state, vagas: Math.max(3, state.vagas - 1) };
    }
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePrograma() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const activeMissions = useRef(new Map<number, ReturnType<typeof setInterval>>());

  // Vagas decrement — every ~20s with some randomness
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.4) dispatch({ type: 'DECREMENT_VAGAS' });
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    activeMissions.current.forEach(interval => clearInterval(interval));
    activeMissions.current.clear();
  }, []);

  /**
   * Completa uma missao com animacao de progresso
   */
  const completeMission = useCallback((id: number) => {
    const mission = state.missions.find(m => m.id === id);
    if (!mission || mission.completed || mission.locked || activeMissions.current.has(id)) return;

    // Animate progress bar via intervals
    let pct = 0;
    const interval = setInterval(() => {
      pct += 5;
      dispatch({ type: 'SET_MISSION_PROGRESS', id, progress: Math.min(pct, 100) });
      if (pct >= 100) {
        clearInterval(interval);
        activeMissions.current.delete(id);
        dispatch({ type: 'COMPLETE_MISSION', id });
      }
    }, 30);
    activeMissions.current.set(id, interval);
  }, [state.missions]);

  // Computed
  const currentLevelName = LEVEL_NAMES[state.level] ?? 'Iniciante';
  const xpForNextLevel   = XP_LEVELS[state.level] ?? XP_LEVELS[4];
  const xpAtCurrentLevel = XP_LEVELS[state.level - 1] ?? 0;
  const xpPercent = Math.min(
    100,
    ((state.xp - xpAtCurrentLevel) / (xpForNextLevel - xpAtCurrentLevel)) * 100
  );

  // Benefits unlocked based on level
  const benefits: Benefit[] = INITIAL_BENEFITS.map(b => ({
    ...b,
    unlocked: state.level >= b.requiredLevel,
  }));

  return {
    state,
    completeMission,
    currentLevelName,
    xpPercent,
    xpForNextLevel,
    benefits,
  };
}
