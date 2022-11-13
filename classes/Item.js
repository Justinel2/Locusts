class Item {
    constructor(name, brand, imageURL) {
      this.name = name;
      this.brand = brand;
      this.imageURL = imageURL;
    }
  
    getItemStats() {
      return `
        Name: ${this.name}
        Brand: ${this.brand}
        ImageURL: ${this.imageURL}
      `;
    }
  }
  
  module.exports = Item;