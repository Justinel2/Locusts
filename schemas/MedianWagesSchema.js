const mongoose = require("mongoose");
const MedianWagesSchema = new mongoose.Schema({
    id:String,
    Ticker:String,
    Company:String,
    Fiscal_Year:String,
    Median_Worker_Pay:String,
    Pay_Ratio:String
})

const MedianWages = mongoose.model("MEDIANWAGE", MedianWagesSchema, "MEDIANWAGES");

module.exports = MedianWages;