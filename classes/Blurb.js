const SubBlurb = require("./SubBlurb");

class Blurb {
    constructor(id, subject, rating, assessmentYear, source, researchName, description, subBlurbs) {
      this.id = id;
      this.subject = subject;
      this.rating = rating;
      this.assessmentYear = assessmentYear;
      this.source = source;
      this.researchName = researchName;
      this.nextAssessment = description;
      // this.description = "";
      this.subBlurbs = [];
    }

    feedData(id, subject, rating, assessmentYear, source, nextAssessment, description) {
      console.log("IN LOOP");
      this.id = id;
      this.subject = subject;
      this.rating = rating;
      this.assessmentYear = assessmentYear;
      this.source = source;
      this.nextAssessment = nextAssessment;
      this.description = description;
      console.log(this);
    }


  }

  module.exports = Blurb;