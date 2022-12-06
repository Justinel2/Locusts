
//Server Express
const express = require("express");
const portNumber = 4200;
const app = express(); //make an instance of express
const server = require("http").createServer(app);
//+
let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


//CONNECTION TO CLIENT
app.use("/searchManualUPC",handleGetProfileByUPC);
app.use("/searchManualKeyword",handleGetProfileByKeyword);

//Node Modules
// var http = require('follow-redirects').http;
const request = require('request');
const Wikiapi = require('wikiapi');

//Classes
const Item = require("./classes/Item");
const Company = require("./classes/Company");
const Blurb = require("./classes/Blurb");
const SubBlurb = require("./classes/SubBlurb");

//Database 
require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.MONGODB_URI;
// console.log(url);
const MedianWagesModel = require("./schemas/MedianWagesSchema.js");
const FAABModel = require("./schemas/FAABSchema.js");
const FAABLegendModel = require("./schemas/FAABLegendsSchema.js");
const { resolve } = require("path");
const { rejects } = require("assert");
const e = require("express");

//COMPANY PROFILE
let newSearchedItem = new Item();
let newSearchedCompany = new Company();
let dbOpened = false;
let foundBrandFromUPC;
let companyKeyword;
let manufacturer;
let foundCoFromBrand;
let manufacturerAvailable;


//---- Connection to db
mongoose.connect(url);
let db = mongoose.connection;
db.once("open", async function(){
  
  console.log("are here");
  dbOpened = true;
})

// make server listen for incoming messages
server.listen(portNumber, function () {
  console.log("listening on port:: " + portNumber);
});
// create a server (using the Express framework object)
app.use(express.static(__dirname + "/public"));
app.use("/client", clientRoute);
//default route
app.get("/", function (req, res) {
  res.send("<h1>Hello world</h1>");
});

function clientRoute(req, res, next) {
  res.sendFile(__dirname + "/public/client.html");
}

/// use this VERB for getting posted data... 9
app.post('/postForm',handlePost);
 
// the callback
function handlePost(request,response){
  console.log(request.body);
  response.send("SUCCESS POST");
}

//HANDLE USER QUERY FROM BRAND
async function handleGetProfileByKeyword (request,response,next){
  
  // Log keyword received from client
  console.log("Keyword received from client: " + request.query.keywordSubmitted);
  
  // Plug the keyword entered by the user in the new item object
  newSearchedItem.brand = request.query.keywordSubmitted;
  console.log(newSearchedItem.brand);

  let result = handleGetProfile(newSearchedItem.brand);

  response.send(result);
}

//HANDLE USER QUERY FROM UPC
async function handleGetProfileByUPC (request,response,next){
  // console.log(request.url);
  foundBrandFromUPC = false;

  //Log UPC received from client
  console.log("UPC received from client: " + request.query.UPCsubmitted);

  //Get product name, image and brand from UPC Code
  let itemArgs = await getUPCPage(request.query.UPCsubmitted);

  if (foundBrandFromUPC) {
    console.log(itemArgs[0] + ", " + itemArgs[1] + ", " + itemArgs[2] + ", ")
    newSearchedItem.name = itemArgs[0];
    newSearchedItem.brand = itemArgs[1];
    newSearchedItem.imageURL = itemArgs[2];

    let result = handleGetProfile(newSearchedItem.brand);
    response.send(result);
  
  }
  // newSearchedItem.motherCo = await getMotherCompany(newSearchedItem.brand);
  // newSearchedCompany.name = newSearchedItem.motherCo;
  // console.log(newSearchedCompany.name);
  // newSearchedCompany.financials.symbol = await getMarketSymbol(newSearchedItem.motherCo);
  // // console.log(newSearchedCompany.financials.symbol);
  // await getYHFinanceProfile(newSearchedCompany.financials.symbol);
  // await getYHFinanceFinancials(newSearchedCompany.financials.symbol);
  // // await getYHFinanceFinancials("PEP");
  // if (dbOpened) {
  //   console.log("db opened")
  //   await getPayrollRatio(newSearchedCompany.financials.symbol);
  //   // await getPayrollRatio("PEP");
  //   await getFoodAndAgricultureBenchmark(newSearchedCompany.name);
  // }

  // let scannedResults = [
  //   this.item = newSearchedItem,
  //   this.company = newSearchedCompany
  // ]
  // response.send(scannedResults);
}

function getUPCPage (upc) {  
  return new Promise((resolve,reject)=> {
    setTimeout(()=>{
      request.post({
        uri: 'https://api.upcitemdb.com/prod/trial/lookup',
        headers: {
          "Content-Type": "application/json"
        },
        gzip: true,
        body: "{ \"upc\": \""+ upc +"\" }",
      }, function (err, resp, body) {
        let entry = JSON.parse(body);
        if(entry.code === "INVALID_UPC") {
          let errorMessage = entry.message;
          reject(errorMessage);
        }
        else if (entry.items[0] === undefined) {
          reject("This UPC is not yet in the database.")
        }
        else {
          // console.log(entry.items[0]);
          let productName = entry.items[0].title;
          console.log("Product name: " + productName);
          let brand = entry.items[0].brand;
          console.log("Brand: " + brand)
          let imageURL = entry.items[0].images[0];
          console.log("ImageURL: " + imageURL);
          let itemArgs = [productName, brand, imageURL];
          foundBrandFromUPC = true;
          resolve(itemArgs); 
        }
      })
    },2000);
  }) 
}

async function handleGetProfile(co) {
  foundCoFromBrand = false;
  manufacturerAvailable = false;

  //Keyword passed from the previous query


  //Get mother company from the brand 
  companyKeyword = await getMotherCompany(newSearchedItem.brand);
  console.log("data is in main loop: " + companyKeyword);
  console.log("foundCoFromBrand= " + foundCoFromBrand);
  console.log("manufacturerAvailable= " + manufacturerAvailable);
  
  //If there was successful result from the brand, plug it in our
  if (foundCoFromBrand) {
    console.log("company found from brand :)");
    newSearchedItem.motherCo = companyKeyword;
    newSearchedCompany.name = newSearchedItem.motherCo;
  }
  //If there is no result from the brand, try from the manufacturer if it is available
  else if (!foundCoFromBrand && manufacturerAvailable) {
    console.log("try to search with manufacturer");
    manufacturer = companyKeyword;
    companyKeyword = await getMotherCompany(manufacturer);
    //If there was successful result from the manufacturer
    if (companyKeyword != undefined) {
      newSearchedItem.motherCo = companyKeyword;
      newSearchedCompany.name = newSearchedItem.motherCo;
    }
    //If there was no result from the manufacturer -> research stops here
    else {
      console.log("NO LUCK HERE");
      response.send("data was able to be retrieved from the information given.");
    }
  }
  //If there was no result from brand and no manufacturer available -> research stops here
  else {
    console.log("NO LUCK HERE");
    response.send("No data was able to be retrieved from the information given.");
  }

  //If we have a company name
  if (newSearchedCompany.name != undefined) {
    
    //Get the market symbol to find the financial data
    newSearchedCompany.financials.symbol = await getMarketSymbol(newSearchedItem.motherCo);
    //Get company market profile
    await getYHFinanceProfile(newSearchedCompany.financials.symbol);
    //Get company financial information
    await getYHFinanceFinancials(newSearchedCompany.financials.symbol);
   
    //If the database is opened
    if (dbOpened) {
      console.log("db opened")
      //Get the payroll ratio (CEO:Worker)
      await getPayrollRatio(newSearchedCompany.financials.symbol);
      //Get the 'Food and Agriculture Benchmark' result for this company
      await getFoodAndAgricultureBenchmark(newSearchedCompany.name);
    }
    
    //Construct an object to pass the item and the company objects to the client
    let scannedResults = [
      this.item = newSearchedItem,
      this.company = newSearchedCompany
    ]
}
}

function getMotherCompany (q) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      let qFormatted = q.replace(' ', '_');
      const wiki = new Wikiapi('en');
      const page_data = await wiki.page(qFormatted);
      const parsed = page_data.parse();
	    let infobox;
      let result;
	    parsed.each('template', template_token => {
		    if (template_token.name.startsWith('Infobox')) {
			    infobox = template_token.parameters;
			  return parsed.each.exit;
		    }
        else {
          // reject();
        }
	    });
      if (infobox != undefined) {
        console.log("infobox is defined");
        for (const [key, value] of Object.entries(infobox)){
          console.log(value);
          infobox[key] = value.toString();
        } 

        // // print json of the infobox
        // console.log(infobox);
        if(infobox.currentowner === undefined) {
          console.log("no current owner parameter")
          if (infobox.owner != undefined) {
            foundCoFromBrand = true;
            console.log("owner found under another syntax")
            result = infobox.owner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
            resolve(result);
          }
          else if (infobox.manufacturer != undefined) {
            console.log("no owner available, but a manufacturer is listed")
            manufacturerAvailable = true;
            result = infobox.manufacturer.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
            console.log("manufacturer: " + result);
          }
          else {
            `reject("No way to find out");`
          }
        }
        else {
          console.log("company found directly from the brand");
          foundCoFromBrand = true;
          result = infobox.currentowner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
        }
        console.log("data passed: " + result);
        resolve(result);
      }
      else {
        console.log("infobox is not defined");
        reject("Infobox is undefined for this page - cannot retrieve information");
      } result = infobox.owner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
    },2000);
  }) 
}

// function getSubsidiaries(company) {
//   setTimeout(async ()=>{
//     const wiki = new Wikiapi('en');
//     const page_data = await wiki.page(company);
//     const parsed = page_data.parse();
//     let infobox;
//     parsed.each('template', template_token => {
//       if (template_token.name.startsWith('Infobox')) {
//         infobox = template_token.parameters;
//       return parsed.each.exit;
//       }
//       else {
//         // reject();
//       }
//     });
//     for (const [key, value] of Object.entries(infobox)){
//       infobox[key] = value.toString();
//     }
//       // print json of the infobox
//       console.log(infobox);
//       // let owner = infobox.currentowner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
//       if (infobox.subsid != undefined) {
        
//       }
//       resolve(owner);
//   },2000);
// }

function getMarketSymbol (company) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      console.log("Searching market symbol of: " + company);
      const options = {
        method: 'GET',
        url: 'https://yh-finance.p.rapidapi.com/auto-complete',
        qs: {q: company, region: 'US'},
        headers: {
          "Content-Type": "application/json",
          'X-RapidAPI-Key': '2a72e9fbffmsh38828a7a5eedea3p1adf7bjsn1f247acedaf0',
          'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com',
          useQueryString: true
        }
      };
      
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        // console.log(body);
        let entry = JSON.parse(body);
        let symbol = entry.quotes[0].symbol;
        // console.log(entry.quotes[0].symbol);
        resolve(symbol);
      });
    },2000);
  }) 
}

function getYHFinanceProfile (symb) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      const options = {
        method: 'GET',
        url: 'https://yh-finance.p.rapidapi.com/stock/v2/get-profile',
        qs: {symbol: symb, region: 'US'},
        headers: {
          'X-RapidAPI-Key': '2a72e9fbffmsh38828a7a5eedea3p1adf7bjsn1f247acedaf0',
          'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com',
          useQueryString: true
        }
      };
      
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        let entry = JSON.parse(body);
        // console.log(entry);
        //PROFILE
        newSearchedCompany.profile.sector = entry.assetProfile.sector;
        newSearchedCompany.profile.industry = entry.assetProfile.industry;
        newSearchedCompany.profile.employeesNb = entry.assetProfile.fullTimeEmployees;
        newSearchedCompany.profile.address[0] = entry.assetProfile.address1;
        newSearchedCompany.profile.address[1] = entry.assetProfile.city + ", " + entry.assetProfile.state + " " + entry.assetProfile.zip;
        newSearchedCompany.profile.address[2] = entry.assetProfile.country;

        //FIANCIALS (KEY EXECUTIVES)
        for (let i = 0; i < entry.assetProfile.companyOfficers.length; i++) {

          newSearchedCompany.financials.keyExecutives[i] = entry.assetProfile.companyOfficers[i].name + ", " + entry.assetProfile.companyOfficers[i].title;
          if (entry.assetProfile.companyOfficers[i].totalPay != undefined) {
            newSearchedCompany.financials.keyExecutives[i] += ", " + entry.assetProfile.companyOfficers[i].totalPay.fmt;
          }
          console.log(newSearchedCompany.financials.keyExecutives[i]);
        }


        resolve();
      });
    },2000);
  }) 
}

function getYHFinanceFinancials (symb) {  
  return new Promise((resolve,reject)=> {
    const options = {
      method: 'GET',
      url: 'https://yh-finance.p.rapidapi.com/stock/v2/get-financials',
      qs: {symbol: symb, region: 'US'},
      headers: {
        'X-RapidAPI-Key': '2a72e9fbffmsh38828a7a5eedea3p1adf7bjsn1f247acedaf0',
        'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com',
        useQueryString: true
      }
    };
      
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        let entry = JSON.parse(body);
        //GROSS REVENUE
        newSearchedCompany.financials.grossRevenue = entry.timeSeries.trailingTotalRevenue[0].reportedValue.fmt;
        newSearchedCompany.financials.grossProfit = entry.timeSeries.trailingGrossProfit[0].reportedValue.fmt;
        newSearchedCompany.financials.profitMargin = newSearchedCompany.financials.getProfitMargin();

        console.log(newSearchedCompany.financials.grossRevenue + ", " + newSearchedCompany.financials.grossProfit + ", profit margin of: " + newSearchedCompany.financials.profitMargin);

        resolve();
      });
    },2000);
  } 

  async function getPayrollRatio (symb) {  
    return new Promise((resolve,reject)=> {
      MedianWagesModel.find({Ticker:symb}).then((result)=> {
        console.log(result[0].Median_Worker_Pay);
        newSearchedCompany.financials.medianWorkerPayroll = result[0].Median_Worker_Pay;
        newSearchedCompany.financials.payrollRatio = result[0].Pay_Ratio;
        newSearchedCompany.financials.fiscalYear = result[0].Fiscal_Year;
        resolve();
      });
      },2000);
    } 

    async function getFoodAndAgricultureBenchmark (co) {  
      let upstream = false;
      let downstream = false;
      let source = "World Benchmarking Alliance";
      let researchName = "Food and Agriculture Benchmark"
      let year = "2021";
      let nextAssessment = "2023";
      let govSubAreas = 3;
      let workersSubAreas = 24;
      let environmentSubAreas = 12;
      let nutritionSubAreas = 6;
      return new Promise((resolve,reject)=> {
        FAABModel.find({Company_name:"PepsiCo"}).then(async (result)=> {
          console.log(result);

          //Create main blurb by subject
          newSearchedCompany.govStrategies.push(new Blurb("MA1", await getLegend('MA1', "n"), result[0].MA1 + "/10", year, source, researchName, nextAssessment, ""));
          newSearchedCompany.workersSocialInclusion.push(new Blurb("MA4", await getLegend('MA4', "n"), result[0].MA4 + "/30", year, source, researchName, nextAssessment, ""));
          newSearchedCompany.environment.push(new Blurb("MA2", await getLegend('MA2', "n"), result[0].MA2 + "/30", year, source, researchName, nextAssessment, ""));
          newSearchedCompany.nutrition.push(new Blurb("MA3", await getLegend('MA3', "n"), result[0].MA3 + "/30", year, source, researchName, nextAssessment, ""));

          //Check for upstream and downstream qualities of the company
          console.log(result[0].Agricultural_inputs);
          if (result[0].Agricultural_inputs === 'Yes' || result[0].Agricultural_products_and_commodities === 'Yes' || result[0].Animal_proteins === 'Yes') {
            upstream = true;
          }
          if (result[0].Food_and_beverage_manufacturers_processors === 'Yes' || result[0].Food_retailers === 'Yes' || result[0].Restaurants_and_food_service === 'Yes') {
            downstream = true;
          }

          //Create subBlurbsfor each mainBlurb
          //GOVERNANCE AND STRATEGY
          for (let i = 1; i <= govSubAreas; i++) {
            let id = "A" + i;
            // console.log(id);
            let rating = result[0][id];
            let scoreLeg = rating.replace(',', '');
            let scoreDenominator = "2";
            let legend = await getLegend(id, ""); 
            newSearchedCompany.govStrategies[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            // console.log(newSearchedCompany.govStrategies[0]);
          }

          //WORKERS AND SOCIAL INCLUSION
          for (let i = 1; i <= workersSubAreas; i++) {
            let id = "D" + i;
            // console.log(id);
            let rating = result[0][id];
            let scoreLeg = rating.replace(',', '');
            let scoreDenominator = "2";
            let legend = await getLegend(id, ""); 
            // console.log(legend.Spec);
            if (legend.Spec === 'LIM') {
              scoreDenominator = "1";
            }
            newSearchedCompany.workersSocialInclusion[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            // console.log(newSearchedCompany.workersSocialInclusion[0]);
          }
          //ENVIRONMENT
          for (let i = 1; i <= environmentSubAreas; i++) {
            let id = "B" + i;
            // console.log(id);
            let rating = result[0][id];
            let scoreLeg = rating.replace(',', '');
            let scoreDenominator = "2";
            let spec = 'DOWNSTREAM';
            let legend;
            // console.log(legend.Spec);
            if (upstream) {
              spec = 'UPSTREAM';
            }
            // console.log(upstream);
            // console.log(spec);
            if (i >= 6 && i <= 8) {
              legend = await getLegendByStream(id, spec);
            }
            else {
              legend = await getLegend(id, "");
            }

            // console.log(legend)
            newSearchedCompany.environment[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            // console.log(newSearchedCompany.environment[0]);
          }

          //NUTRITION
          for (let i = 1; i <= nutritionSubAreas; i++) {
            let id = "C" + i;
            // console.log(id);
            let rating = result[0][id];
            let scoreLeg = rating.replace(',', '');
            let scoreDenominator = "2";
            let spec = 'UPSTREAM';
            let legend;
            // console.log(legend.Spec);
            if (downstream) {
              spec = 'DOWNSTREAM';
            }
            console.log(upstream);
            console.log(spec);
            if (i <= 2) {
              legend = await getLegendByStream(id, spec);
            }
            else {
              legend = await getLegend(id, "");
            }

            // console.log(legend)
            newSearchedCompany.nutrition[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            // console.log(newSearchedCompany.nutrition[0]);
          }


          // console.log(newSearchedCompany.govStrategies[0]);

          // newSearchedCompany.compileResource(source, year, nextAssessment, result[0], upstream, downstream, legend);
          // newSearchedCompany.govStrategies.push(new Blurb());
          // newSearchedCompany.govStrategies.
          // console.log(newSearchedCompany.govStrategies[0]);
          resolve();
        });
        },2000);
      } 

      async function getLegend (code, q) {  
        return new Promise((resolve,reject)=> {
          FAABLegendModel.find({Code:code}).then((result)=> {
            // console.log(result);
            if (q === "n") {
              resolve(result[0].Name);
            }
            else {
              resolve(result[0])
            }
          });
          },2000);
        } 
        async function getLegendByStream (code, q) {  
          return new Promise((resolve,reject)=> {
            FAABLegendModel.find({Code:code, Spec:q}).then((result)=> {
                resolve(result[0])
            });
            },2000);
          } 