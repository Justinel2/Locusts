
//Server Express
const express = require("express");
const portNumber = 4200;
const app = express(); //make an instance of express
const server = require("http").createServer(app);
//+
let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/varsToMongo',handleGetVars);

//Node Modules
// var http = require('follow-redirects').http;
const request = require('request');
const Wikiapi = require('wikiapi');

//Classes
const Item = require("./classes/Item");

//Database 
require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.MONGODB_URI;
// console.log(url);
const CanadianClimateModel = require("./schemas/CanadianWeatherSchema.js");
const { resolve } = require("path");
const { rejects } = require("assert");

//---- Connection to db
mongoose.connect(url);
let db = mongoose.connection;
db.once("open", async function(){
  
  console.log("are here");
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
async function  handleGetVars  (request,response,next){
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


