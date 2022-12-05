const CompanyOverview = require("./CompanyOverview");
const FinancialProfile = require("./FinancialProfile");
const Blurb = require("./Blurb");
const SubBlurb = require("./SubBlurb");

class Company {
    constructor(name, profile, financials, govStrategies, workersSocialInclusion, environment, nutrition) {
      this.name = "";
      // this.profile = [];
      this.profile = new CompanyOverview();
      this.financials = new FinancialProfile();
      this.govStrategies = [];
      this.workersSocialInclusion= [];
      this.environment = [];
      this.nutrition = [];
    }

  }
  
  module.exports = Company;