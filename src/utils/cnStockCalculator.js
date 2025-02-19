export function calculateAStockFees(amount, type) {
  // 佣金费用（券商收取）- 最低5元，一般为交易金额的0.025%
  const commission = Math.max(amount * 0.00025, 5)
  
  // 印花税（仅卖出时收取）- 成交金额的0.05%
  const stampDuty = type === 'sell' ? amount * 0.0005 : 0
  
  // 过户费（上交所/深交所收取）- 成交金额的0.001%
  const transferFee = amount * 0.00001
  
  const total = commission + stampDuty + transferFee
  
  return {
    commission: commission.toFixed(2),
    stampDuty: stampDuty.toFixed(2),
    transferFee: transferFee.toFixed(2),
    total: total.toFixed(2)
  }
} 