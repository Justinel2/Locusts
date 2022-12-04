const CompanyOverview = require("./CompanyOverview");
const FinancialProfile = require("./FinancialProfile");
const Blurb = require("./classes/Blurb");

class Company {
    constructor(name, profile, financials, social, environment) {
      this.name = "";
      // this.profile = [];
      this.profile = new CompanyOverview();
      this.financials = new FinancialProfile();
      this.social = [];
      this.environment = [];
    }
  
    // getItemStats() {
    //   return `
    //     Name: ${this.name}
    //     Brand: ${this.brand}
    //     MotherCo: ${this.motherCo}
    //     ImageURL: ${this.imageURL}
    //     Subsidies: ${this.subsidies}
    //   `;
    // }
  }
  
  module.exports = Company;