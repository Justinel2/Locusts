
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
const https = require('https');
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
//////Schemas
const MedianWagesModel = require("./schemas/MedianWagesSchema.js");
const FAABModel = require("./schemas/FAABSchema.js");
const FAABLegendModel = require("./schemas/FAABLegendsSchema.js");


const { resolve } = require("path");
const { rejects } = require("assert");
const e = require("express");
const { abort } = require("process");

//OBJECTS
let newSearchedItem = new Item();
let newSearchedCompany = new Company();
//STATUS VERIFICATION
let dbOpened = false;
let foundBrandFromUPC;
let companyKeyword;
let manufacturer;
let parent;
let foundCoFromBrand;
let manufacturerAvailable;
let parentAvailable;
let abortMission;
let statusInfo;


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
// app.post('/postForm',handlePost);
 
// the callback
function handlePost(request,response){
  console.log(request.body);
  response.send("SUCCESS POST");
}

//-------------------------------------------------------------------------------------------------------------------------------------
//HANDLE USER QUERY FROM BRAND
//Triggered by a button click on the client side's search page
//Async function that communicate with the client side
//Handles the request and the response to the client for a search on a company
//profile by a keyword
//
async function handleGetProfileByKeyword (request,response,next){
  
  // Log keyword received from client
  console.log("Keyword received from client: " + request.query.keywordSubmitted);
  
  // Plug the keyword entered by the user in the new item object
  newSearchedItem.brand = request.query.keywordSubmitted;
  console.log(newSearchedItem.brand);

  //From the brand, try to get information about the mother company
  await handleGetProfile(newSearchedItem.brand);

  console.log("back in the main function to send the info to the client");

  //Construct an object to pass the item and the company objects to the client
  let scannedResults = [
    this.status = abortMission,
    this.item = newSearchedItem,
    this.company = newSearchedCompany,
    this.statusInfo = "Sorry, couldn't find anything. Try again."
  ]

  //Send results to the client
  response.send(scannedResults);
}

//-------------------------------------------------------------------------------------------------------------------------------------
//HANDLE USER QUERY FROM UPC
//Triggered by a button click on the client side's search page
//Async function that communicate with the client side
//Handles the request and the response to the client for a search on a company
//profile by a UPC
//
async function handleGetProfileByUPC (request,response,next){
  // console.log(request.url);
  foundBrandFromUPC = false;

  //Log UPC received from client
  console.log("UPC received from client: " + request.query.UPCsubmitted);

  //Get product name, image and brand from UPC Code
  let itemArgs = await getUPCPage(request.query.UPCsubmitted);

  // if (!foundBrandFromUPC) {
  //   itemArgs = await getSecondUPCPage(request.query.UPCsubmitted);
  // }

  //If we could find information with the UPC
  if (foundBrandFromUPC) {
    // console.log(itemArgs[0] + ", " + itemArgs[1] + ", " + itemArgs[2] + ", ")
    //Plug the product name, brand and image url in the new item object
    newSearchedItem.name = itemArgs[0];
    newSearchedItem.brand = itemArgs[1];
    newSearchedItem.imageURL = itemArgs[2];

    //From the brand, try to get information about the mother company
    await handleGetProfile(newSearchedItem.brand);

    console.log("back in the main function to send the info to the client");

    //Construct an object to pass the item and the company objects to the client
    let scannedResults = [
      this.status = abortMission,
      this.item = newSearchedItem,
      this.company = newSearchedCompany
    ]
          //Send results to the client
          response.send(scannedResults);
  
  }
  else {
    let scannedResults = [
      this.status = abortMission,
      this.statusInfo = statusInfo
    ]

          //Send results to the client
          response.send(scannedResults);
  }
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET INFORMATION ABOUT ITEM FROM UPC
//Called from the function handleGetProfilebyUPC
//Request to UpCiteUPC API 
//If data is found in their database for this UPC, we can obtain the:
//Item name, brand and image link
//
function getUPCPage (upc) { 
  //Promise with a timeout 
  return new Promise((resolve,reject)=> {
    setTimeout(()=>{
      //Request module makes a request to the UPCitemDB with the UPC code entered by the user
      request.post({
        uri: 'https://api.upcitemdb.com/prod/trial/lookup',
        headers: {
          "Content-Type": "application/json"
        },
        gzip: true,
        body: "{ \"upc\": \""+ upc +"\" }",
        //Handle the response from the API
      }, function (err, resp, body) {
        //Parse the API response so it is easier to manipulate
        let entry = JSON.parse(body);
        //If the code entered return as an invalid UPC, reject the promise with the API error message
        //in that case, it is the user that has to enter a valid UPC (it is not because they do not have this one in the db)
        if(entry.code === "INVALID_UPC") {
          let errorMessage = entry.message;
          abortMission = true;
          statusInfo = "The UPC entered is invalid. Please try again."
          console.log(statusInfo);
          // reject(errorMessage);
          // let itemArgs = [undefined, undefined, undefined];
          resolve();
        }
        //If the UPC is valid no information is returned from UPCitemDB
        else if (entry.items[0] === undefined) {
          abortMission = true;
          statusInfo = "This UPC is not yet in the database. Try searching the brand.";
          // reject("This UPC is not yet in the database.")
          // let itemArgs = [undefined, undefined, undefined];
          resolve();
        }
        //If the API returns information about this UPC
        else {
          // console.log(entry.items[0]);
          //Plug and log the values for the product name, brand and image URL
          let productName = entry.items[0].title;
          console.log("Product name: " + productName);
          let brand = entry.items[0].brand;
          console.log("Brand: " + brand)
          let imageURL = entry.items[0].images[0];
          console.log("ImageURL: " + imageURL);
          let itemArgs = [productName, brand, imageURL];
          //Indicate that the brand was found from the UPC
          foundBrandFromUPC = true;
          //Resolve the promise with an array of the information retrieved
          resolve(itemArgs); 
        }
      })
    },2000);
  }) 
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET INFORMATION ABOUT ITEM FROM UPC
//Called from the function handleGetProfilebyUPC
//Request to UpCiteUPC API 
//If data is found in their database for this UPC, we can obtain the:
//Item name, brand and image link
//
function getSecondUPCPage (upc) { 
  //Promise with a timeout 
  return new Promise((resolve,reject)=> {
    setTimeout(()=>{
      console.log("TO CHECK: " + upc);
      var opts = {
        hostname: 'buycott.com',
        path: '/api/v4/products/lookup',
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        }
      };
      var req = https.request(opts, function(response) {
        response.on('data', function(data) {
          console.log('Content: ' + data);
        });
      });
      req.on('error', function(e) {
        console.log('Error: ' + e.message);
      });
      req.write('{ "barcode": "0060410054406", "access_token": "k8km__uZgPjjxE73nETeHqHWRP2kDPuxtcgEjt7n" }');
      req.end();
    },2000);
  }) 
}


//-------------------------------------------------------------------------------------------------------------------------------------
//GET INFORMATION ABOUT THE MOTHER COMPANY FROM THE BRAND (OR ANOTHER KEYWORD)
//Called by both the handleGetProfileByUPC and the handleGetProfileByKeyword when they have the same information
//Async function that orchestrate the rest of the requests to API and retrieve in my database
//The result is what will then be communicated with the client through the handleGetProfileByUPC or the handleGetProfileByKeyword
//
async function handleGetProfile(co) {
  //Redefine our research indicators to false
  foundCoFromBrand = false;
  manufacturerAvailable = false;
  abortMission = false;


  //Keyword passed from the previous query
  console.log("find company information from: " + co);

  //Get mother company from the brand 
  companyKeyword = await getMotherCompany(newSearchedItem.brand);
  console.log("data is in main loop: " + companyKeyword);
  console.log("foundCoFromBrand= " + foundCoFromBrand);
  console.log("manufacturerAvailable= " + manufacturerAvailable);
  console.log("parentAvailable= " + parentAvailable);
  
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
  }
  //If there is no result from the brand and manufacturer, try from the parent if it is available
  else if (!foundCoFromBrand && parentAvailable) {
    console.log("try to search with parent");
    if (companyKeyword != undefined) {
      newSearchedItem.motherCo = companyKeyword;
      newSearchedCompany.name = newSearchedItem.motherCo;
    }
    //If there was no result from the manufacturer and parent -> research stops here
    else if (companyKeyword === "undefined"){
      console.log("NO LUCK HERE");
      abortMission = true;
    }
  }
  //If there was no result from brand and no manufacturer available -> research stops here
  else {
    console.log("NO LUCK HERE");
    abortMission = true;

  }

  //If we have a company name
  if (abortMission != true) {
    
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

    // return(scannedResults);
}
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET THE MOTHER COMPANY OF THE BRAND
//Called from the function handleGetProfile
//Request the wiki databse through the wiki API module
//
function getMotherCompany (q) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      //Replace any spaces from the query string to underscores to fit the wiki format for pages
      let qFormatted = q.replace(' ', '_');
      qFormatted = q.replace('Frito Lays', 'Frito-Lay')
      // let qFormatted = q.replace('&', '');
      //
      const wiki = new Wikiapi('en');
      const page_data = await wiki.page(qFormatted);
      const parsed = page_data.parse();
	    let infobox;
      let result;
      //Parse the infobox template 
	    parsed.each('template', template_token => {
		    if (template_token.name.startsWith('Infobox')) {
			    infobox = template_token.parameters;
			  return parsed.each.exit;
		    }
        else {
          // reject();
        }
	    });
      //If the infobox is defined
      if (infobox != undefined) {
        console.log("infobox is defined");
        //Stringify each of the infobox values
        for (const [key, value] of Object.entries(infobox)){
          // console.log(value);
          infobox[key] = value.toString();
        } 
        // // print json of the infobox
        // console.log(infobox);
        // If the key 'currentowner' is not defined in this infobox
        if(infobox.currentowner === undefined) {
          console.log(infobox.currentowner);
          if (infobox.parent != undefined){
            console.log("no owner or manufacturer available, but a parent is listed: " + infobox.parent)
            //Indicate that a manufacturer has been found
            parentAvailable = true;
            //Plug the value without the brackets as a result
            result = infobox.parent.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
            console.log("parent: " + result);
          }
          //But there is a key 'owner' defined
          else if (infobox.owner != undefined) {
            //Indicate that the mother company has been found
            foundCoFromBrand = true;
            console.log("owner found under another syntax")
            //Plug the value without the brackets as a result
            result = infobox.owner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
          }
          //If there is also no key 'owner' defined, but there is a key 'manufacturer'
          else if (infobox.manufacturer != undefined) {
            console.log("no owner available, but a manufacturer is listed")
            //Indicate that a manufacturer has been found
            manufacturerAvailable = true;
            //Plug the value without the brackets as a result
            result = infobox.manufacturer.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
            console.log("manufacturer: " + result);
          }
          //++++++++++++++
          else {
            result = q;
            // `reject("No way to find out");`
          }
        }
        else {
          //If the key 'currentowner' is available
          console.log("company found directly from the brand");
          //Indicate that the mother company has been found
          foundCoFromBrand = true;
          //Plug the value without the brackets as a result
          result = infobox.currentowner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
        }
        //Log in the value found
        console.log("data passed: " + result);
        //Resolve this value
        resolve(result);
      }
      //If the infobox is undefined
      else {
        // console.log("infobox is not defined");
        //No information can be retrieved from this keyword
        console.log("Infobox is undefined for this page - cannot retrieve information");
        resolve("undefined");
      }
    },2000);
  }) 
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET THE MARKET SYMBOL OF THE COMPANY FROM THE COMPANY NAME
//Called from the function handleGetProfile
//Requests the YH Finance API - key registered through Rapid API
//Resolves void
//
function getMarketSymbol (company) {
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      console.log("Searching market symbol of: " + company);
      //Defines the options for the request
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
      //Request the API with the option defined earlier
      request(options, function (error, response, body) {
        //If there is an erreur -> new error
        if (error) throw new Error(error);
        // console.log(body);
        //Else, parse the results
        let entry = JSON.parse(body);
        //Get the market symbol from the results
        let symbol = entry.quotes[0].symbol;
        //Resolve the market symbol
        resolve(symbol);
      });
    },2000);
  }) 
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET THE COMPANY PROFILE INFORMATION FROM THE MARKET SYMBOL OF THE COMPANY
//Called from the function handleGetProfile
//Requests the YH Finance API - key registered through Rapid API
//Resolves void
//
function getYHFinanceProfile (symb) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      //Defines the options for the request
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
      //Request the API with the option defined earlier
      request(options, function (error, response, body) {
        //If there is an erreur -> new error
        if (error) throw new Error(error);
        //Parse the result
        let entry = JSON.parse(body);
        // console.log(entry);

        //PLUG COMPANY PROFILE INFO IN THE COMPANY OBJECT
        newSearchedCompany.profile.sector = entry.assetProfile.sector;
        newSearchedCompany.profile.industry = entry.assetProfile.industry;
        newSearchedCompany.profile.employeesNb = entry.assetProfile.fullTimeEmployees;
        newSearchedCompany.profile.address[0] = entry.assetProfile.address1;
        newSearchedCompany.profile.address[1] = entry.assetProfile.city + ", " + entry.assetProfile.state + " " + entry.assetProfile.zip;
        newSearchedCompany.profile.address[2] = entry.assetProfile.country;

        //PLUG COMPANY FIANCIAL PROFILE (KEY EXECUTIVES) IN THE COMPANY OBJECT
        for (let i = 0; i < entry.assetProfile.companyOfficers.length; i++) {

          newSearchedCompany.financials.keyExecutives[i] = entry.assetProfile.companyOfficers[i].name + ", " + entry.assetProfile.companyOfficers[i].title;
          if (entry.assetProfile.companyOfficers[i].totalPay != undefined) {
            newSearchedCompany.financials.keyExecutives[i] += ", " + entry.assetProfile.companyOfficers[i].totalPay.fmt;
          }
          // console.log(newSearchedCompany.financials.keyExecutives[i]);
        }
        //Resolve an empty response (void)
        resolve();
      });
    },2000);
  }) 
}

//-------------------------------------------------------------------------------------------------------------------------------------
//GET THE COMPANY FINANCIAL INFORMATION FROM THE MARKET SYMBOL OF THE COMPANY
//Called from the function handleGetProfile
//Requests the YH Finance API - key registered through Rapid API
//Resolves void
//
function getYHFinanceFinancials (symb) {  
  return new Promise((resolve,reject)=> {
    //Defines the options for the request
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
      //Request the API with the option defined earlier
      request(options, function (error, response, body) {
        //If there is an erreur -> new error
        if (error) throw new Error(error);
        //Parse the result
        let entry = JSON.parse(body);

        //PLUG COMPANY GROSS REVENUE, GROSS PROFIT AND CALCULATE THE PROFIT MARGIN (AND PLUG IT) IN THE COMPANY OBJECT
        newSearchedCompany.financials.grossRevenue = entry.timeSeries.trailingTotalRevenue[0].reportedValue.fmt;
        newSearchedCompany.financials.grossProfit = entry.timeSeries.trailingGrossProfit[0].reportedValue.fmt;
        newSearchedCompany.financials.profitMargin = newSearchedCompany.financials.getProfitMargin();

        // console.log(newSearchedCompany.financials.grossRevenue + ", " + newSearchedCompany.financials.grossProfit + ", profit margin of: " + newSearchedCompany.financials.profitMargin);

        //Resolve an empty response (void)
        resolve();
      });
    },2000);
  } 

//-------------------------------------------------------------------------------------------------------------------------------------
//GET THE COMPANY MEDIAN SALARY AND CEO:WORKER PAYROLL RATIO FROM THE COMPANY MARKET SYMBOL
//Called from the function handleGetProfile
//Accesses my MongoDB, where I manually added the info from AFLCIO
//Resolves void
//
  async function getPayrollRatio (symb) {  
    return new Promise((resolve,reject)=> {
      //Find the company entry withthe market symbol
      MedianWagesModel.find({Ticker:symb}).then((result)=> {
        if (result[0] != undefined){
          //PLUG IN THE MEDIAN PAY, THE RATIO AND THE FISCAL YEAR IN THE COMPANY OBJECT
          newSearchedCompany.financials.medianWorkerPayroll = result[0].Median_Worker_Pay;
          newSearchedCompany.financials.payrollRatio = result[0].Pay_Ratio;
          newSearchedCompany.financials.fiscalYear = result[0].Fiscal_Year;
        }
        // console.log(result[0].Median_Worker_Pay);
        //Resolve an empty response (void)
        resolve();
      });
      },2000);
    } 

//-------------------------------------------------------------------------------------------------------------------------------------
//GET COMPANY HABITS INFO FROM COMPANY NAME: FOOD AND AGRICULTURE BENCHMARK 
//Called from the function handleGetProfile
//Accesses my MongoDB, where I imported the CSV data results from the World Benchmarking Alliance website and manual
//Resolves void
//
    async function getFoodAndAgricultureBenchmark (co) {  
      //Declare company specs variables by default
      let upstream = false;
      let downstream = false;
      //Declare and define the static variables about this study
      let source = "World Benchmarking Alliance";
      let researchName = "Food and Agriculture Benchmark"
      let year = "2021";
      let nextAssessment = "2023";
      let govSubAreas = 3;
      let workersSubAreas = 24;
      let environmentSubAreas = 12;
      let nutritionSubAreas = 6;

      return new Promise((resolve,reject)=> {
        //Find the company entry with the company name
        FAABModel.find({Company_name:co}).then(async (result)=> {
          // console.log(result);

          if (result != undefined) {
            console.log("retrieving company habits information from the databases");
            //Create main blurb objects by subject
            newSearchedCompany.govStrategies = [];
            newSearchedCompany.govStrategies.push(new Blurb("MA1", await getLegend('MA1', "n"), result[0].MA1 + "/10", year, source, researchName, nextAssessment, ""));
            newSearchedCompany.workersSocialInclusion = [];
            newSearchedCompany.workersSocialInclusion.push(new Blurb("MA4", await getLegend('MA4', "n"), result[0].MA4 + "/30", year, source, researchName, nextAssessment, ""));
            newSearchedCompany.environment = [];
            newSearchedCompany.environment.push(new Blurb("MA2", await getLegend('MA2', "n"), result[0].MA2 + "/30", year, source, researchName, nextAssessment, ""));
            newSearchedCompany.nutrition = [];
            newSearchedCompany.nutrition.push(new Blurb("MA3", await getLegend('MA3', "n"), result[0].MA3 + "/30", year, source, researchName, nextAssessment, ""));

            //Check for upstream and downstream qualities of the company
            if (result[0].Agricultural_inputs === 'Yes' || result[0].Agricultural_products_and_commodities === 'Yes' || result[0].Animal_proteins === 'Yes') {
              upstream = true;
            }
            if (result[0].Food_and_beverage_manufacturers_processors === 'Yes' || result[0].Food_retailers === 'Yes' || result[0].Restaurants_and_food_service === 'Yes') {
              downstream = true;
            }

            //Create subBlurbs for each mainBlurb

            //GOVERNANCE AND STRATEGY
            for (let i = 1; i <= govSubAreas; i++) {
              let id = "A" + i;
              let rating = result[0][id];
              let scoreLeg = rating.replace(',', '');
              let scoreDenominator = "2";
              let legend = await getLegend(id, ""); 
              newSearchedCompany.govStrategies[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            }

            //WORKERS AND SOCIAL INCLUSION
            for (let i = 1; i <= workersSubAreas; i++) {
              let id = "D" + i;
              let rating = result[0][id];
              let scoreLeg = rating.replace(',', '');
              let scoreDenominator = "2";
              let legend = await getLegend(id, ""); 
              if (legend.Spec === 'LIM') {
                scoreDenominator = "1";
              }
              //INSTANTIANCE NEW SUB BLURBS IN EACH BLURB OBJECT
              newSearchedCompany.workersSocialInclusion[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            }

            //ENVIRONMENT
            for (let i = 1; i <= environmentSubAreas; i++) {
              let id = "B" + i;
              let rating = result[0][id];
              let scoreLeg = rating.replace(',', '');
              let scoreDenominator = "2";
              let spec = 'DOWNSTREAM';
              let legend;
              if (upstream) {
                spec = 'UPSTREAM';
              }
              if (i >= 6 && i <= 8) {
                legend = await getLegendByStream(id, spec);
              }
              else {
                legend = await getLegend(id, "");
              }
              //INSTANTIANCE NEW SUB BLURBS IN EACH BLURB OBJECT
              newSearchedCompany.environment[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            }

            //NUTRITION
            for (let i = 1; i <= nutritionSubAreas; i++) {
              let id = "C" + i;
              let rating = result[0][id];
              let scoreLeg = rating.replace(',', '');
              let scoreDenominator = "2";
              let spec = 'UPSTREAM';
              let legend;
              if (downstream) {
                spec = 'DOWNSTREAM';
              }
              if (i <= 2) {
                legend = await getLegendByStream(id, spec);
              }
              else {
                legend = await getLegend(id, "");
              }

              //INSTANTIANCE NEW SUB BLURBS IN EACH BLURB OBJECT 
              newSearchedCompany.nutrition[0].subBlurbs.push(new SubBlurb(id, legend.Name, rating + "/" + scoreDenominator, "", legend['Score' + scoreLeg + "_Pros"], legend['Score' + scoreLeg + "_Cons"]));
            }

            resolve();
          }

        });
        },2000);
      } 

//-------------------------------------------------------------------------------------------------------------------------------------
//GET GRADING DEFINITION (LEGEND) FROM: FOOD AND AGRICULTURE BENCHMARK 
//Searches in the db with the criteria code
//Called from the function getFoodAndAgricultureBenchmark
//Accesses my MongoDB, where I manually imported the notes and manual information from the World Benchmarking Alliance to interpret their data
//
      async function getLegend (code, q) {  
        return new Promise((resolve,reject)=> {
          FAABLegendModel.find({Code:code}).then((result)=> {
            // console.log(result);
            //If the query regards just the name
            if (q === "n") {
              //Return the name of the criteria only
              resolve(result[0].Name);
            }
            else {
              //Return the whole entry
              resolve(result[0])
            }
          });
          },2000);
        } 

//-------------------------------------------------------------------------------------------------------------------------------------
//GET GRADING DEFINITION (LEGEND) FROM: FOOD AND AGRICULTURE BENCHMARK 
//Searches in the db with AND the company spec (upstream or downstream)
//Called from the function getFoodAndAgricultureBenchmark
//Accesses my MongoDB, where I manually imported the notes and manual information from the World Benchmarking Alliance to interpret their data
//
        async function getLegendByStream (code, q) {  
          return new Promise((resolve,reject)=> {
            FAABLegendModel.find({Code:code, Spec:q}).then((result)=> {
                //Resolve the whole entry
                resolve(result[0])
            });
            },2000);
          } 