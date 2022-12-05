const mongoose = require("mongoose");
const FAABLegendSchema = new mongoose.Schema({
    id:String,
    Code:String,
    Name:String,
    Sub_Area:String,
    Main_Area_Associated:String,
    Area_Definition:String,
    Spec:String,
    Score0_Cons:String,
    Score05_Pros:String,
    Score05_Cons:String,
    Score1_Pros:String,
    Score1_Cons:String,
    Score15_Pros:String,
    Score15_Cons:String,
    Score2_Pros:String,
    Main_Concept_Source:String,
    Source_Link:String

})

const FAABLegend = mongoose.model("FAABLEGEND", FAABLegendSchema, "FAABLEGENDS");

module.exports = FAABLegend;