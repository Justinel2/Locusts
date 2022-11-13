const mongoose = require("mongoose");
const CanadianClimateSchema = new mongoose.Schema({
    id:String,
    LOCAL_DATE:String,
    MEAN_TEMPERATURE_CALGARY:String,
    TOTAL_PRECIPITATION_CALGARY:String,
    MEAN_TEMPERATURE_MONCTON:String,
    TOTAL_PRECIPITATION_MONCTON:String,
    MEAN_TEMPERATURE_OTTAWA:String,
    TOTAL_PRECIPITATION_OTTAWA:String,
    MEAN_TEMPERATURE_SASKATOON:String,
    TOTAL_PRECIPITATION_SASKATOON:String,
    MEAN_TEMPERATURE_TORONTO:String,
    TOTAL_PRECIPITATION_TORONTO:String,
    MEAN_TEMPERATURE_VANCOUVER:String,
    TOTAL_PRECIPITATION_VANCOUVER:String,
    MEAN_TEMPERATURE_WINNIPEG:String,
    TOTAL_PRECIPITATION_WINNIPEG:String
})

const CanadianClimate = mongoose.model("CANADIANCLIMATEENTRY", CanadianClimateSchema, "WEATHERCANADA");

module.exports = CanadianClimate;