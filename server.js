
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

//Node Modules
// var http = require('follow-redirects').http;
const request = require('request');
const Wikiapi = require('wikiapi');

//Classes
const Item = require("./classes/Item");
const Company = require("./classes/Company");
const Blurb = require("./classes/Blurb");

//Database 
require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.MONGODB_URI;
// console.log(url);
const MedianWagesModel = require("./schemas/MedianWagesSchema.js");
const { resolve } = require("path");
const { rejects } = require("assert");

//COMPANY PROFILE
let newSearchedCompany = new Company();
let dbOpened = false;


//---- Connection to db
mongoose.connect(url);
let db = mongoose.connection;
db.once("open", async function(){
  
  console.log("are here");
  dbOpened = true;
  // CanadianClimateModel.find({TOTAL_PRECIPITATION_CALGARY:"0.5"}).then((result)=>{
    // console.log(result);
  // });

  // let resCount = await CanadianClimateModel.countDocuments({TOTAL_PRECIPITATION_CALGARY:"0.5"});
  // console.log(resCount);

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

//EXAMPLE of  user making a query ... 10
async function handleGetProfileByUPC (request,response,next){
  let newSearchedItem = new Item();

  console.log(request.url);
  console.log(request.query.UPCsubmitted);
  response.send("SUCCESS GET");
  // let results = await CanadianClimateModel.find({TOTAL_PRECIPITATION_CALGARY:request.query.UPCsubmitted});
  // console.log(results[0]);
  // response.send(results);
//   let results = await request.get('https://api.upcitemdb.com/prod/trial/lookup/upc='+ request.query.UPCsubmitted, { json: true }, (err, res, body) => {
//   if (err) { return console.log(err); }
//   console.log(body.url);
//   console.log(body.explanation);
// });
// console.log(results);
  // let item =  await getUPCPage(request.query.UPCsubmitted);
  // let company = await getMotherCompany(item.brand);
  newSearchedItem.motherCo = await getMotherCompany("Gatorade");
  console.log(newSearchedItem.motherCo);
  // newSearchedCompany.financials.symbol = await getMarketSymbol(newSearchedItem.motherCo);
  // console.log(newSearchedCompany.financials.symbol);
  // await getYHFinanceProfile(newSearchedCompany.financials.symbol);
  // await getYHFinanceFinancials(newSearchedCompany.financials.symbol);
  // await getYHFinanceFinancials("PEP");
  if (dbOpened) {
    console.log("db opened")
    // await getPayrollRatio(newSearchedCompany.financials.symbol);
    await getFoodAndAgricultureBenchmark("PEP");
  }
  // newSearchedItem.subsidiaries = await getSubsidiaries(newSearchedItem.motherCo);
  // console.log(item);
  // console.log(item.getItemStats());
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
        // console.log('server encoded the data as: ' + (resp.headers['content-encoding'] || 'identity'))
        // console.log('the decoded data is: ' + body)
        let entry = JSON.parse(body);
        if(entry.code === "INVALID_UPC") {
          let errorMessage = entry.message;
          // console.log(errorMessage);
          reject(errorMessage);
        }
        else {
          let productName = entry.items[0].title;
          let brand = entry.items[0].brand;
          let imageURL = entry.items[0].images[0];
          // console.log(productName, brand, imageURL);
          // let searchedItem = [productName, brand, imageURL];
          // let searchedItem = new Item(productName, brand, imageURL);
          newSearchedItem.name = productName;
          newSearchedItem.brand = brand;
          newSearchedItem.imageURL = imageURL;
          // console.log(searchedItem);
          resolve(newSearchedItem); 
        }
      })
    },2000);
  }) 
}

function getMotherCompany (brand) {  
  return new Promise((resolve,reject)=> {
    setTimeout(async ()=>{
      const wiki = new Wikiapi('en');
      const page_data = await wiki.page(brand);
      const parsed = page_data.parse();
	    let infobox;
	    parsed.each('template', template_token => {
		    if (template_token.name.startsWith('Infobox')) {
			    infobox = template_token.parameters;
			  return parsed.each.exit;
		    }
        else {
          // reject();
        }
	    });
	    for (const [key, value] of Object.entries(infobox)){
        infobox[key] = value.toString();
      }
	      // print json of the infobox
        let owner = infobox.currentowner.match(new RegExp("\\[.*?\\]","g"),"")[0].replace(/\[|\]/g,'');
        resolve(owner);
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
      // console.log(company);
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
            newSearchedCompany.financials.keyExecutives[i] += ", " + entry.assetProfile.companyOfficers[i].totalPay.fmt + " (" + entry.assetProfile.companyOfficers[i].fiscalYear + ")"
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


