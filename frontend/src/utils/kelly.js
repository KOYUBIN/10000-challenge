/**
 * 켈리 공식 계산
 * @param {number} winRate - 승률 (0~1)
 * @param {number} rr - 손익비 (수익/손실)
 * @returns {{ full: number, half: number, quarter: number }}
 */
export function kellyFraction(winRate, rr) {
  const p = winRate;
  const q = 1 - p;
  const b = rr;
  const full = (b * p - q) / b;
  return {
    full: Math.max(0, full),
    half: Math.max(0, full / 2),
    quarter: Math.max(0, full / 4),
  };
}

/**
 * 포지션 수량 계산
 * @param {number} bankroll - 전체 뱅크롤
 * @param {number} riskPct - 리스크 비율 (0~1)
 * @param {number} entryPrice - 진입가
 * @param {number} stopLoss - 손절가
 * @returns {{ riskAmount: number, qty: number, effectiveLeverage: number }}
 */
export function calcPositionSize(bankroll, riskPct, entryPrice, stopLoss) {
  const riskAmount = bankroll * riskPct;
  const priceDiff = Math.abs(entryPrice - stopLoss);
  if (priceDiff === 0) return { riskAmount, qty: 0, effectiveLeverage: 0 };
  const qty = riskAmount / priceDiff;
  const positionValue = qty * entryPrice;
  const effectiveLeverage = positionValue / bankroll;
  return { riskAmount, qty, effectiveLeverage };
}

/**
 * 손익비 계산
 * @param {number} entryPrice
 * @param {number} stopLoss
 * @param {number} takeProfit
 * @param {'LONG'|'SHORT'} side
 */
export function calcRR(entryPrice, stopLoss, takeProfit, side) {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  if (risk === 0) return 0;
  return reward / risk;
}
