class Blurb {
    constructor(id, subject, rating, assessmentYear, source, description, externalLink, isASubBlurb, mainID) {
      this.id = 0;
      this.subject = "";
      this.rating = "";
      this.assessmentYear = "";
      this.source = "";
      this.description = "";
      this.externalLink = "";
      this.isASubBlurb = false;
      this.mainID = 0;
    }
  }
  
  module.exports = Blurb;