<template>
  <div class="calculator">
    <div class="market-selector">
      <label>
        <input type="radio" name="market" value="hk" v-model="currentMarket" />
        港股
      </label>
      <label>
        <input type="radio" name="market" value="cn" v-model="currentMarket" />
        A股
      </label>
    </div>

    <h2>{{ marketTitle }}</h2>

    <div class="input-group">
      <label :for="buyPrice"
        >买入价格（{{ currentMarket === "hk" ? "港元" : "元" }}）:</label
      >
      <input
        type="number"
        id="buyPrice"
        v-model="buyPrice"
        step="0.001"
        placeholder="请输入买入价格"
      />
    </div>

    <div class="input-group">
      <label :for="sellPrice"
        >卖出价格（{{ currentMarket === "hk" ? "港元" : "元" }}）:</label
      >
      <input
        type="number"
        id="sellPrice"
        v-model="sellPrice"
        step="0.001"
        placeholder="请输入卖出价格"
      />
    </div>

    <div class="input-group">
      <label for="shares">股数:</label>
      <input
        type="number"
        id="shares"
        v-model="shares"
        step="100"
        min="100"
        placeholder="请输入股票数量（100的整数倍）"
      />
    </div>

    <div class="input-group">
      <label for="cash"
        >当前现金（{{ currentMarket === "hk" ? "港元" : "元" }}）:</label
      >
      <input
        type="number"
        id="cash"
        v-model="cash"
        step="1"
        placeholder="请输入当前可用现金"
      />
    </div>

    <div class="input-group">
      <label for="holdingDays">预计持股天数:</label>
      <input
        type="number"
        id="holdingDays"
        v-model="holdingDays"
        min="1"
        placeholder="请输入预计持股天数"
      />
    </div>

    <div class="input-group">
      <label
        >买入金额：{{ buyAmount }}
        {{ currentMarket === "hk" ? "港元" : "元" }}</label
      >
    </div>

    <div class="input-group">
      <label
        >卖出金额：{{ sellAmount }}
        {{ currentMarket === "hk" ? "港元" : "元" }}</label
      >
    </div>

    <div class="input-group" v-if="needFinancing">
      <label
        >需要融资：{{ financingAmount }}
        {{ currentMarket === "hk" ? "港元" : "元" }}</label
      >
      <label
        >预计融资成本：{{ financingCost }}
        {{ currentMarket === "hk" ? "港元" : "元" }}</label
      >
    </div>

    <button @click="calculateProfit">计算盈亏</button>

    <div class="result" v-html="result"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { calculateHKFees } from "../utils/hkStockCalculator";
import { calculateAStockFees } from "../utils/cnStockCalculator";

const currentMarket = ref("hk");
const buyPrice = ref("");
const sellPrice = ref("");
const shares = ref("");
const cash = ref("");
const holdingDays = ref("");
const result = ref("");

const marketTitle = computed(() =>
  currentMarket.value === "hk" ? "港股佣金计算器" : "A股佣金计算器"
);

const buyAmount = computed(() => {
  const amount = Number(buyPrice.value) * Number(shares.value) || 0;
  return amount.toFixed(2);
});

const sellAmount = computed(() => {
  const amount = Number(sellPrice.value) * Number(shares.value) || 0;
  return amount.toFixed(2);
});

// 计算是否需要融资和融资金额
const needFinancing = computed(() => {
  const totalCost = Number(buyAmount.value);
  const availableCash = Number(cash.value) || 0;
  return totalCost > availableCash;
});

const financingAmount = computed(() => {
  if (!needFinancing.value) return 0;
  const totalCost = Number(buyAmount.value);
  const availableCash = Number(cash.value) || 0;
  return (totalCost - availableCash).toFixed(2);
});

// 计算融资成本
const financingCost = computed(() => {
  if (!needFinancing.value || !holdingDays.value) return 0;
  const amount = Number(financingAmount.value);
  console.log("amount", amount);
  const days = Number(holdingDays.value);
  // 港股年利率6.8%
  const annualRate = currentMarket.value === "hk" ? 0.068 : 0.08; // A股假设8%
  return ((amount * annualRate * days) / 365).toFixed(2);
});

watch(currentMarket, () => {
  buyPrice.value = "";
  sellPrice.value = "";
  shares.value = "";
  cash.value = "";
  holdingDays.value = "";
  result.value = "";
});

const validateInputs = () => {
  const buy = Number(buyPrice.value);
  const sell = Number(sellPrice.value);
  const qty = Number(shares.value);

  if (
    isNaN(buy) ||
    isNaN(sell) ||
    isNaN(qty) ||
    buy <= 0 ||
    sell <= 0 ||
    qty <= 0 ||
    qty % 100 !== 0
  ) {
    alert("请输入有效的买入价、卖出价和股数（股数必须是100的整数倍）");
    return false;
  }
  return true;
};

const calculateProfit = () => {
  if (!validateInputs()) return;

  const buyAmt = Number(buyAmount.value);
  const sellAmt = Number(sellAmount.value);

  if (currentMarket.value === "hk") {
    calculateHKProfit(buyAmt, sellAmt);
  } else {
    calculateCNProfit(buyAmt, sellAmt);
  }
};

const calculateHKProfit = (buyAmt, sellAmt) => {
  const buyFees = calculateHKFees(buyAmt);
  const sellFees = calculateHKFees(sellAmt);

  // 加入融资成本
  const financingCostValue = Number(financingCost.value);

  const totalCost = buyAmt + buyFees.total + financingCostValue;
  const totalRevenue = sellAmt - sellFees.total;
  const profit = totalRevenue - totalCost;

  result.value = `
    <h3>交易分析</h3>
    <h4>买入详情：</h4>
    <p>买入金额：${buyAmt.toFixed(2)} 港元</p>
    <p>买入费用：${buyFees.total.toFixed(2)} 港元</p>
    ${
      needFinancing.value
        ? `
    <p>融资金额：${financingAmount.value} 港元</p>
    <p>融资成本：${financingCostValue.toFixed(2)} 港元</p>
    `
        : ""
    }
    <p>买入成本：${totalCost.toFixed(2)} 港元</p>
    <h4>卖出详情：</h4>
    <p>卖出金额：${sellAmt.toFixed(2)} 港元</p>
    <p>卖出费用：${sellFees.total.toFixed(2)} 港元</p>
    <p>实际所得：${totalRevenue.toFixed(2)} 港元</p>
    <h4>盈亏结果：${profit.toFixed(2)} 港元 (${(
    (profit / totalCost) *
    100
  ).toFixed(2)}%)</h4>
  `;
};

const calculateCNProfit = (buyAmt, sellAmt) => {
  const buyFees = calculateAStockFees(buyAmt, "buy");
  const sellFees = calculateAStockFees(sellAmt, "sell");

  // 加入融资成本
  const financingCostValue = Number(financingCost.value);

  const totalBuyFees = Number(buyFees.total);
  const totalSellFees = Number(sellFees.total);

  const totalCost = buyAmt + totalBuyFees + financingCostValue;
  const totalRevenue = sellAmt - totalSellFees;
  const profit = totalRevenue - totalCost;

  result.value = `
    <h3>交易分析</h3>
    <h4>买入详情：</h4>
    <p>买入金额：${buyAmt.toFixed(2)} 元</p>
    <p>买入佣金：${buyFees.commission} 元</p>
    <p>过户费：${buyFees.transferFee} 元</p>
    ${
      needFinancing.value
        ? `
    <p>融资金额：${financingAmount.value} 元</p>
    <p>融资成本：${financingCostValue.toFixed(2)} 元</p>
    `
        : ""
    }
    <p>买入成本：${totalCost.toFixed(2)} 元</p>
    <h4>卖出详情：</h4>
    <p>卖出金额：${sellAmt.toFixed(2)} 元</p>
    <p>卖出佣金：${sellFees.commission} 元</p>
    <p>印花税：${sellFees.stampDuty} 元</p>
    <p>过户费：${sellFees.transferFee} 元</p>
    <p>实际所得：${totalRevenue.toFixed(2)} 元</p>
    <h4>盈亏结果：${profit.toFixed(2)} 元 (${(
    (profit / totalCost) *
    100
  ).toFixed(2)}%)</h4>
  `;
};
</script>

<style scoped>
.calculator {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
}

.input-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.market-selector {
  margin-bottom: 20px;
  text-align: center;
}

.market-selector label {
  margin: 0 10px;
  cursor: pointer;
}
</style>
