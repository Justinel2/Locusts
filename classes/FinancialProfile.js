class FinancialProfile {
    constructor(symbol, grossRevenue, grossProfit, profitMargin, keyExecutives) {
      this.symbol = "";
      this.grossRevenue = ""; 
      this.grossProfit = "";
      this.profitMargin = "";
      this.keyExecutives = [];
      this.medianWorkerPayroll = "";
      this.payrollRatio = "";
      this.fiscalYear = "";
    }

    getProfitMargin() {
        let revenue = this.grossRevenue.replace('B','');
        let profit = this.grossProfit.replace('B','');
        let margin = (100 * Number(profit) / Number(revenue)).toFixed(2);
        return ("" + margin + "%");
    }

  }
  
  module.exports = FinancialProfile;