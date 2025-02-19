export function calculateHKFees(amount) {
  const commission = Math.max(amount * 0.0003, 3) // 佣金
  const platformFee = 15 // 平台使用费
  const tradingFee = Math.max(amount * 0.00005650, 0.01) // 交易费
  const stampDuty = Math.ceil(amount * 0.001) // 印花税
  const transferFee = Math.min(Math.max(amount * 0.00002, 2), 100) // 交收费
  const sfcLevyFee = Math.max(amount * 0.000027, 0.01) // 证监会征费
  const frcLevyFee = amount * 0.0000015 // 财汇局征费

  const total = commission + platformFee + tradingFee + 
                stampDuty + transferFee + sfcLevyFee + frcLevyFee

  return {
    commission,
    platformFee,
    tradingFee,
    stampDuty,
    transferFee,
    sfcLevyFee,
    frcLevyFee,
    total
  }
} 