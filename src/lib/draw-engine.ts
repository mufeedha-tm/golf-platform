
export type DrawMode = 'random' | 'algorithmic_most' | 'algorithmic_least';

export interface ScoreEntry {
  userId: string;
  points: number[]; 
}

export interface DrawResult {
  winningNumbers: number[];
  winners: {
    match5: string[]; 
    match4: string[];
    match3: string[];
  };
  prizes: {
    pool5: number;
    pool4: number;
    pool3: number;
    perWinner5: number;
    perWinner4: number;
    perWinner3: number;
  };
  jackpotRollover: boolean;
  rolloverAmount: number;
  prizePerUser: {
    match5: number;
    match4: number;
    match3: number;
  };
  totalPool: number;
}

export function getAlgorithmicNumbers(allScores: number[], mode: 'most' | 'least'): number[] {
  const freqMap: Record<number, number> = {};
  allScores.forEach(s => {
    freqMap[s] = (freqMap[s] || 0) + 1;
  });

  const sorted = Object.entries(freqMap)
    .map(([num, count]) => ({ num: parseInt(num), count }))
    .sort((a, b) => mode === 'most' ? b.count - a.count : a.count - b.count);

  return sorted.slice(0, 5).map(s => s.num);
}

export function getRandomNumbers(): number[] {
  const nums: number[] = [];
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

export interface DrawMatchEvaluation {
  matchCount: number;
 
  matchedNumbers: number[];
}

export function calculateMatches(
  userScores: number[],
  drawNumbers: number[]
): DrawMatchEvaluation {
  const scores = userScores.slice(0, 5);
  const draws = drawNumbers.slice(0, 5);

  const available: Record<number, number> = {};
  for (const s of scores) {
    available[s] = (available[s] ?? 0) + 1;
  }

  const matchedNumbers: number[] = [];
  for (const d of draws) {
    const n = available[d] ?? 0;
    if (n > 0) {
      matchedNumbers.push(d);
      available[d] = n - 1;
    }
  }

  return { matchCount: matchedNumbers.length, matchedNumbers };
}
 
export function executeDraw(
  userEntries: ScoreEntry[], 
  mode: DrawMode = 'random',
  totalPool: number = 0,
  currentRollover: number = 0
): DrawResult {
  if (userEntries.length === 0) {
    return {
      winningNumbers: mode === 'random' ? getRandomNumbers() : [],
      winners: { match5: [], match4: [], match3: [] },
      prizes: { pool5: 0, pool4: 0, pool3: 0, perWinner5: 0, perWinner4: 0, perWinner3: 0 },
      jackpotRollover: true,
      rolloverAmount: Math.round((currentRollover + totalPool * 0.4) * 100) / 100,
      prizePerUser: { match5: 0, match4: 0, match3: 0 },
      totalPool
    };
  }
  let winningNumbers: number[];
  
  if (mode === 'random') {
    winningNumbers = getRandomNumbers();
  } else {
    const allPoints = userEntries.flatMap(e => e.points);
    winningNumbers = getAlgorithmicNumbers(allPoints, mode === 'algorithmic_most' ? 'most' : 'least');
   
    while (winningNumbers.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1;
      if (!winningNumbers.includes(n)) winningNumbers.push(n);
    }
  }

  const winners = {
    match5: [] as string[],
    match4: [] as string[],
    match3: [] as string[],
  };

  userEntries.forEach(entry => {
    const { matchCount } = calculateMatches(entry.points, winningNumbers);
    if (matchCount === 5) winners.match5.push(entry.userId);
    else if (matchCount === 4) winners.match4.push(entry.userId);
    else if (matchCount === 3) winners.match3.push(entry.userId);
  });

  const pool5 = Math.floor((currentRollover + totalPool * 0.4) * 100) / 100;
  const pool4 = Math.floor(totalPool * 0.35 * 100) / 100;
  const pool3 = Math.floor(totalPool * 0.25 * 100) / 100;

  const perWinner5 = winners.match5.length > 0 ? Math.floor((pool5 / winners.match5.length) * 100) / 100 : 0;
  const perWinner4 = winners.match4.length > 0 ? Math.floor((pool4 / winners.match4.length) * 100) / 100 : 0;
  const perWinner3 = winners.match3.length > 0 ? Math.floor((pool3 / winners.match3.length) * 100) / 100 : 0;
  const totalRollover = winners.match5.length === 0 ? pool5 : 0;

  return { 
    winningNumbers, 
    winners, 
    prizes: { pool5, pool4, pool3, perWinner5, perWinner4, perWinner3 },
    jackpotRollover: winners.match5.length === 0,
    rolloverAmount: totalRollover,
    prizePerUser: { match5: perWinner5, match4: perWinner4, match3: perWinner3 },
    totalPool
  };
}
