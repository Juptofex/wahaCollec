export type Stratagem = {
  name: string;
  type?: string;
  cp_cost?: number | string;
  turn?: string;
  phase?: string;
  legend?: string;
  description?: string;
};

export type PhaseGroup = {
  phase: string;
  stratagems: Stratagem[];
};

export type TurnGroup = {
  turn: string;
  phaseGroups: PhaseGroup[];
};

const PHASE_ORDER = [
  "Command",
  "Movement",
  "Reinforcements",
  "Shooting",
  "Charge",
  "Fight",
];
const TURN_ORDER = ["Your turn", "Opponent's turn", "Either player's turn"];

function rankOf(value: string, order: string[]) {
  const idx = order.findIndex((o) =>
    value.toLowerCase().includes(o.toLowerCase()),
  );
  return idx === -1 ? order.length : idx;
}

function cpCost(stratagem: Stratagem) {
  const value = Number(stratagem.cp_cost);
  return Number.isFinite(value) ? value : Infinity;
}

function groupByPhase(stratagems: Stratagem[]): PhaseGroup[] {
  const groups = new Map<string, Stratagem[]>();

  for (const s of stratagems) {
    const key = s.phase?.trim() || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const rankDiff = rankOf(a, PHASE_ORDER) - rankOf(b, PHASE_ORDER);
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    })
    .map(([phase, items]) => ({
      phase,
      stratagems: [...items].sort((a, b) => {
        const costDiff = cpCost(a) - cpCost(b);
        return costDiff !== 0 ? costDiff : a.name.localeCompare(b.name);
      }),
    }));
}

export function groupStratagemsByTurnAndPhase(
  stratagems: Stratagem[],
): TurnGroup[] {
  const groups = new Map<string, Stratagem[]>();

  for (const s of stratagems) {
    const key = s.turn?.trim() || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const rankDiff = rankOf(a, TURN_ORDER) - rankOf(b, TURN_ORDER);
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    })
    .map(([turn, items]) => ({
      turn,
      phaseGroups: groupByPhase(items),
    }));
}
