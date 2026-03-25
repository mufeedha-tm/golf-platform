export interface PrizePoolInput {
  totalActiveSubscribers: number;
  subscriptionPrice: number;
  poolPercentage: number;
}

export interface PrizeDistributionInput {
  totalPool: number;
  rolloverAmount: number;
  winners: {
    match5: number;
    match4: number;
    match3: number;
  };
}

export interface PrizeDistributionResult {
  pool5: number;
  pool4: number;
  pool3: number;
  prizePerUser: {
    match5: number;
    match4: number;
    match3: number;
  };
  rolloverAmount: number;
}

export function calculateTotalPool(input: PrizePoolInput): number {
  const raw = input.totalActiveSubscribers * input.subscriptionPrice * input.poolPercentage;
  return Math.round(raw * 100) / 100;
}

export function distributePrizePool(input: PrizeDistributionInput): PrizeDistributionResult {
  const pool5 = Math.round((input.rolloverAmount + input.totalPool * 0.4) * 100) / 100;
  const pool4 = Math.round(input.totalPool * 0.35 * 100) / 100;
  const pool3 = Math.round(input.totalPool * 0.25 * 100) / 100;

  const prizePerUser = {
    match5: input.winners.match5 > 0 ? Math.round((pool5 / input.winners.match5) * 100) / 100 : 0,
    match4: input.winners.match4 > 0 ? Math.round((pool4 / input.winners.match4) * 100) / 100 : 0,
    match3: input.winners.match3 > 0 ? Math.round((pool3 / input.winners.match3) * 100) / 100 : 0,
  };

  return {
    pool5,
    pool4,
    pool3,
    prizePerUser,
    rolloverAmount: input.winners.match5 > 0 ? 0 : pool5,
  };
}
