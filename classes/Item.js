class Item {
    constructor(name, brand, motherCo, imageURL) {
      this.name = "N/A";
      this.brand = "";
      this.motherCo = "";
      this.imageURL = "";
      this.subsidies = [];
    }
  
    getItemStats() {
      return `
        Name: ${this.name}
        Brand: ${this.brand}
        MotherCo: ${this.motherCo}
        ImageURL: ${this.imageURL}
        Subsidies: ${this.subsidies}
      `;
    }
  }
  
  module.exports = Item;