const express = require("express");
const portNumber = 4200;
const app = express(); //make an instance of express
const server = require("http").createServer(app);
require("dotenv").config();
const mongoose = require("mongoose");
const request = require('request');
const Item = require("./classes/Item");

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/varsToMongo',handleGetVars);

const url = process.env.MONGODB_URI;
console.log(url);
const CanadianClimateModel = require("./schemas/CanadianWeatherSchema.js");
const { resolve } = require("path");
const { rejects } = require("assert");

//connect to db
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
  let item =  await getUPCPage(request.query.UPCsubmitted);
  // console.log(item);
  console.log(item.getItemStats());
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
        console.log('server encoded the data as: ' + (resp.headers['content-encoding'] || 'identity'))
        console.log('the decoded data is: ' + body)
        let entry = JSON.parse(body);
        if(entry.code === "INVALID_UPC") {
          let errorMessage = entry.message;
          console.log(errorMessage);
          reject(errorMessage);
        }
        else {
          let productName = entry.items[0].title;
          let brand = entry.items[0].brand;
          let imageURL = entry.items[0].images[0];
          // console.log(productName, brand, imageURL);
          // let searchedItem = [productName, brand, imageURL];
          let searchedItem = new Item(productName, brand, imageURL);
          // console.log(searchedItem);
          resolve(searchedItem); 
        }
      })
    },2000);
  }) 
}



