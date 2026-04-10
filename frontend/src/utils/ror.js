/**
 * 파산 확률 (Risk of Ruin) 시뮬레이션
 * 몬테카를로 방식으로 n번 시뮬레이션
 *
 * @param {number} winRate - 승률 (0~1)
 * @param {number} rr - 손익비
 * @param {number} riskPct - 회당 리스크 비율 (0~1)
 * @param {number} trades - 총 거래 횟수
 * @param {number} simCount - 시뮬레이션 횟수
 * @returns {{ ror: number, paths: number[][], finalBalances: number[] }}
 */
export function simulateRoR(winRate, rr, riskPct, trades = 100, simCount = 1000) {
  let ruinCount = 0;
  const paths = [];
  const finalBalances = [];

  for (let s = 0; s < simCount; s++) {
    let balance = 1; // 정규화된 초기 뱅크롤
    const path = [balance];
    let ruined = false;

    for (let t = 0; t < trades; t++) {
      const win = Math.random() < winRate;
      const risk = balance * riskPct;
      if (win) {
        balance += risk * rr;
      } else {
        balance -= risk;
      }
      if (balance <= 0.1) {
        // 90% 손실 시 파산으로 간주
        ruined = true;
        balance = 0;
      }
      path.push(parseFloat(balance.toFixed(4)));
      if (ruined) break;
    }

    if (ruined) ruinCount++;
    if (s < 20) paths.push(path); // 시각화용 20개만 저장
    finalBalances.push(balance);
  }

  return {
    ror: (ruinCount / simCount) * 100,
    paths,
    finalBalances,
    medianFinal: median(finalBalances),
    avgFinal: finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length,
  };
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 연속 손실 후 잔고 계산
 * @param {number} bankroll
 * @param {number} riskPct
 * @param {number} streak - 연속 손실 횟수
 */
export function calcLosingStreak(bankroll, riskPct, streak) {
  let b = bankroll;
  for (let i = 0; i < streak; i++) {
    b -= b * riskPct;
  }
  return b;
}
