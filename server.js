const express = require("express");
const portNumber = 4200;
const app = express(); //make an instance of express
const server = require("http").createServer(app);
//ADD DATABASE
require("dotenv").config();
const mongoose = require("mongoose");

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/varsToMongo',handleGetVars);

//IN CLASS WORK
const url = process.env.MONGODB_URI;
// console.log(url);
//access model
const CNNArticlesModel = require("./CNNArticles.js");
const CanadianWeatherModel = require("./CanadianWeatherDB");

//Connect to db
mongoose.connect(url);
let db = mongoose.connection;
db.once("open", async function(){
    
  // console.log("are here");

  //Function that returns a promise because it takes a lot of time
  //FIND ALL QUERIES
  // CNNArticlesModel.find({Category:"news"}).then((result)=>{
  //   console.log(result[0].Author);
  // })
  //FIND ONE QUERY
  // CanadianClimateModel.findOne({LOCAL_DATE:"01-Jan-1940 00:00:00"}).then((result)=>{
  //   console.log(result);
  // }) 
  //FIND ON TWO DIFFERENT FIELDS
  // CanadianClimateModel.find({LOCAL_DATE:"01-Jan-1940 00:00:00", TOTAL_PRECIPITATION_MONCTON:'0.0'}).then((result)=>{
  //   console.log(result);
  // })
  //ONLY PRINT OUT SOME FIELDS (IN THIS CASE ONLY LOCAL DATE)
  //  CanadianClimateModel.find({LOCAL_DATE:"01-Jan-1940 00:00:00"},"LOCAL_DATE").then((result)=>{
  //   console.log(result);
  // }) 
  //COUNT THE AMOUNT OF ENTRIES
  // let resCount = await CanadianClimateModel.countDocuments({MEAN_TEMPERATURE_CALGARY:'-11.4'});
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
  console.log(request.query.paramOne);
  try {
    // response.send("SUCCESS GET");
    let dateEntered = request.query.paramOne;
    let randomArticle = await CNNArticlesModel.aggregate([
      { $match: { "Date_published":{$regex:dateEntered.substr(4,6)} }},
      { $sample: { size: 1 } }]);
    let weatherForecast = await CanadianWeatherModel.find({Category:"news"})
    console.log(dateEntered.substr(4,6));
    console.log(randomArticle);
    let dateString = await getDateInString(randomArticle);
    let headline = await getHeadline(randomArticle);
    let article = await getPars(randomArticle);
    let temperatures = await getTemperatures();
    // response.send(dateString, headline, article, temperatures);
  }
  catch(error){
    console.log("error: " + error);
  }
}

function getDateInString(article) {
  return new Promise((resolve,reject)=>{
    //EXECUTING CODE (EXECUTOR)
    setTimeout(() => {
      let date = article[0].Date_published.substr(0,10);
      console.log(date);
      let stringDate = "";
      const splitDate = date.split('-');
        switch(splitDate[1]) {
          case "01":
            stringDate = "January " + splitDate[2] + ", " + splitDate[0];
            break;
          case "02":
            stringDate = "February " + splitDate[2] + ", " + splitDate[0];
            break;
          case "03":
            stringDate = "March " + splitDate[2] + ", " + splitDate[0];
            break;
          case "04":
            stringDate = "April " + splitDate[2] + ", " + splitDate[0];
            break;
          case "05":
            stringDate = "May " + splitDate[2] + ", " + splitDate[0];
            break;
          case "06":
            stringDate = "June " + splitDate[2] + ", " + splitDate[0];
            break;
          case "07":
            stringDate = "July " + splitDate[2] + ", " + splitDate[0];
            break;
          case "08":
            stringDate = "August " + splitDate[2] + ", " + splitDate[0];
            break;
          case "09":
            stringDate = "September " + splitDate[2] + ", " + splitDate[0];
            break;
          case "10":
            stringDate = "October " + splitDate[2] + ", " + splitDate[0];
            break;
          case "11":
            stringDate = "November " + splitDate[2] + ", " + splitDate[0];
            break;
          case "12":
            stringDate = "December " + splitDate[2] + ", " + splitDate[0];
            break;
          default:
            stringDate = "Invalid Date";
        }
        if (stringDate === "Invalid Date"){
          reject(stringDate);
        }
        console.log(stringDate);
        resolve(stringDate);
      }, 0050);
    })
}

function getHeadline(article){
  return new Promise((resolve,reject)=>{
    setTimeout(() => {
      let headline = "";
      if (article) {
        headline = article[0].Headline;
      } else {
        headline = "No Article Found"
      reject(headline);
      }
      resolve(headline);
      }, 0050);
    })
}

function getPars(article){
  return new Promise((resolve,reject)=>{
    setTimeout(() => {
      let content = "";
      if (article) {
        headline = article[0].Article_Text;
      } else {
        headline = "Please try another date"
      reject(content);
      }
      resolve(content);
      }, 0050);
    })
}



