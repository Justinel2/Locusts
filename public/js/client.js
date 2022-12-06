window.onload = function () {
  console.log("we are loaded");

 //GET DATA BY UPC CODE
 document.querySelector("#findDataWithKeyword").addEventListener('click', function(event){
  console.log("click");
  let keyword = document.getElementById("searchCritKeyword").value;
  console.log(keyword);
  $.get(
    "/searchManualKeyword",
    {keywordSubmitted : keyword},
   // if we get a response from the server .... 
    function(response) {
       console.log("Mission was aborted:" + response[0]);
       if (response[0]) {
        let error = "Sorry, couldn't find anything. Try again."
        console.log(error);
        displayErrorMessage(error);
       }
       else {
        displayItem(response[1]);
        displayCompany(response[2]);
       }
  })
});//click

  //GET DATA BY UPC CODE
  document.querySelector("#findDataWithUPC").addEventListener('click', function(event){
    console.log("click");
    let UPCcode = document.getElementById("searchCritUPC").value;
    $.get(
      "/searchManualUPC",
      {UPCsubmitted : UPCcode},
     // if we get a response from the server .... 
      function(response) {
        
        console.log("Mission was aborted:" + response[0]);
        if (response[0]) {
          let error = "Sorry, couldn't find anything. Try again."
          console.log(error);
          displayErrorMessage(error);
        }
        else {
          displayItem(response[1]);
          displayCompany(response[2]);
        }
  })
});//click

$('.togglable').click(function() {
  console.log("Click level 1")
  verifyListDisplay();
  verifyLink();
  $(this).parent().children('div').toggle(1000);
});
};

function displayErrorMessage(err) {
  $('#error-spot').empty();
  $('#error-spot').append('<p class="--Inter-Regular">' + err + '</p>');
}

function verifyLink() {
  let links = document.getElementsByClassName('to-format-link');
  for (let i = 0; i < links.length; i++) {
    // console.log(links[i].textContent);
    if (links[i].textContent === "undefined") {
      console.log(links[i] + " is undefined so delete!")
      links[i].parentElement.remove();
    }
  }
}

function verifyListDisplay() {
  let parasToFormat = document.getElementsByClassName('to-format');
  for (let i = 0; i < parasToFormat.length; i++) {
    let string = String(parasToFormat[i].textContent);
    string.replace("undefined", "Nothing pointed out by the study");

    //split at every '>' character
    let elements = string.split('> ');

    //Put the title first (not a li element)
    //The .trim() is to remove the weird line breaks symbol from my db
    parasToFormat[i].textContent = elements[0].trim();

    //Starting at the second split element, insert each as a 'li'
    for (let j = 1; j < elements.length; j++) {    
      let li = document.createElement("li");
      li.classList.add("--Inter-Black");
      li.classList.add("subtext");
      li.textContent = elements[j].trim();
      parasToFormat[i].parentElement.append(li);
    }  

  }

}


function subToggle(element) {
  // console.log("Click level 2");
  let selector = element.parentElement.parentElement.parentElement.id;
  // console.log(selector);
  $('#' + selector).children('.sub-blurb').toggle(1000);
}

function subToggleDetails(element) {
  // console.log("Click level 3");
  let selector = element.parentElement.parentElement.parentElement.id;
  // console.log(selector);
  $('#' + selector).children('.sub-blurb-details').toggle(1000);
}



function displayItem(item) {
  console.log(item);
  if (item.name != "" || item.name != undefined) {
    $('#product-name').text(item.name);
  }
  if (item.brand != "" || item.brand != undefined) {
    $('#product-brand').text(item.brand);  
  }
  if (item.motherCo != "" || item.motherCo != undefined) {
    $('#product-company').text(item.motherCo);  
  }
  if (item.imageURL != "" || item.imageURL != undefined) {
    $('#item-image').replaceWith('<img id="item-image" src="' + item.imageURL + '"alt="">');  
  }
}

function displayCompany(company) {
  console.log(company);
  $('#error-spot').empty();

  //PROFILE + FINANCIAL PROFILE
  // if (company.financials.symbol != "" || company.financials.symbol != undefined) {
    $('#container-result-company-name').text(company.name);
    $('#company-profile-sector').text(company.profile.sector);
    $('#company-profile-industry').text(company.profile.industry);
    $('#company-profile-nb-employees').text("Approximately " + company.profile.employeesNb + " full time employees.");
    $('#company-address-1').text(company.profile.address[0]);
    $('#company-address-2').text(company.profile.address[1]);
    $('#company-address-3').text(company.profile.address[2]);

    $('#concerned-financial-year').text(company.financials.fiscalYear + "/TTM");
    $('#company-gross-revenue').text("Gross Revenue: " + company.financials.grossRevenue);
    $('#company-gross-profit').text("Gross Profit: " + company.financials.grossProfit);
    $('#company-profit-margin span').text(company.financials.profitMargin);
    $('#company-median-salary').text("Median Annual Salary: $" + company.financials.medianWorkerPayroll);
    $('#company-salary-ratio span').text(company.financials.payrollRatio);
    
    $('#company-key-executives p.subtext').empty();
    for (let i = 0; i < company.financials.keyExecutives.length; i++) {
       $('#company-key-executives').append('<p class="subtext">' + company.financials.keyExecutives[i] + '</>')
    }

    //RESOURCES TABS

    //GOVERNANCE AND MANAGEMENT
    $('#tab-governance-content').empty();
    if (company.govStrategies.length > 0) {
      for (let i = 0; i < company.govStrategies.length; i++) {
        $('#tab-governance-content').append('<div id="tab-governance-content-' + i + '" class="new-resource"><div class="flex"><div class="eighty"><p class="subtext">' + company.govStrategies[i].source + '</p><p>' + company.govStrategies[i].researchName + '</p></div><div class="twenty"><p>' + company.govStrategies[i].assessmentYear + '</p></div></div><div class="flex"><div class="eighty"><p class="--Inter-Black sub-togglable" onclick="subToggle(this)">' + company.govStrategies[i].subject + ' +</p></div><div class="twenty"><p>' + company.govStrategies[i].rating + '</p></div></div></div>');
        for (let j = 0; j < company.govStrategies[i].subBlurbs.length; j++) {
          // const element = company.govStrategies.subBlurbs[j];
          $('#tab-governance-content-'+i).append('<div id="tab-governance-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.govStrategies[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.govStrategies[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.govStrategies[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black">Pros:</p><p class="to-format">'+ company.govStrategies[i].subBlurbs[j].pros +'</p></div><div><p class"--Inter-Black">Cons:</p><p class="to-format">'+ company.govStrategies[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.govStrategies[i].subBlurbs[j].externalLink +'">' + company.govStrategies[i].subBlurbs[j].externalSource + '</a></p></div></div>');
        }
      }
    }
    else {
      $('#tab-governance-content').append('No data yet');
    }

    //WORKERS AND SOCIAL
    $('#tab-workers-content').empty();
    if (company.workersSocialInclusion.length > 0) {
      for (let i = 0; i < company.workersSocialInclusion.length; i++) {
        $('#tab-workers-content').append('<div id="tab-workers-content-' + i + '" class="new-resource"><div class="flex"><div class="eighty"><p class="subtext">' + company.workersSocialInclusion[i].source + '</p><p>' + company.workersSocialInclusion[i].researchName + '</p></div><div class="twenty"><p>' + company.workersSocialInclusion[i].assessmentYear + '</p></div></div><div class="flex"><div class="eighty"><p class="--Inter-Black sub-togglable" onclick="subToggle(this)">' + company.workersSocialInclusion[i].subject + ' +</p></div><div class="twenty"><p>' + company.workersSocialInclusion[i].rating + '</p></div></div></div>');
        for (let j = 0; j < company.workersSocialInclusion[i].subBlurbs.length; j++) {
          // const element = company.workersSocialInclusion.subBlurbs[j];
          $('#tab-workers-content-'+i).append('<div id="tab-workers-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.workersSocialInclusion[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.workersSocialInclusion[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.workersSocialInclusion[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black">Pros:</p><p class="to-format">'+ company.workersSocialInclusion[i].subBlurbs[j].pros +'</p></div><div><p class"--Inter-Black">Cons:</p><p class="to-format">'+ company.workersSocialInclusion[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.workersSocialInclusion[i].subBlurbs[j].externalLink +'">' + company.workersSocialInclusion[i].subBlurbs[j].externalSource + '</a></p></div></div>');
        }
      }
    }
    else {
      $('#tab-workers-content').append('No data yet');
    }

   //ENVIRONMENT
   $('#tab-environment-content').empty();
   if (company.environment.length > 0) {
     for (let i = 0; i < company.environment.length; i++) {
       $('#tab-environment-content').append('<div id="tab-environment-content-' + i + '" class="new-resource"><div class="flex"><div class="eighty"><p class="subtext">' + company.environment[i].source + '</p><p>' + company.environment[i].researchName + '</p></div><div class="twenty"><p>' + company.environment[i].assessmentYear + '</p></div></div><div class="flex"><div class="eighty"><p class="--Inter-Black sub-togglable" onclick="subToggle(this)">' + company.environment[i].subject + ' +</p></div><div class="twenty"><p>' + company.environment[i].rating + '</p></div></div></div>');
       for (let j = 0; j < company.environment[i].subBlurbs.length; j++) {
         // const element = company.environment.subBlurbs[j];
         $('#tab-environment-content-'+i).append('<div id="tab-environment-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.environment[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.environment[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.environment[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black">Pros:</p><p class="to-format">'+ company.environment[i].subBlurbs[j].pros +'</p></div><div><p class"--Inter-Black">Cons:</p><p class="to-format">'+ company.environment[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.environment[i].subBlurbs[j].externalLink +'">' + company.environment[i].subBlurbs[j].externalSource + '</a></p></div></div>');
       }
     }
   }
   else {
     $('#tab-environment-content').append('No data yet');
   }

   //NUTRITION
   $('#tab-nutrition-content').empty();
   if (company.nutrition.length > 0) {
     for (let i = 0; i < company.nutrition.length; i++) {
       $('#tab-nutrition-content').append('<div id="tab-nutrition-content-' + i + '" class="new-resource"><div class="flex"><div class="eighty"><p class="subtext">' + company.nutrition[i].source + '</p><p>' + company.nutrition[i].researchName + '</p></div><div class="twenty"><p>' + company.nutrition[i].assessmentYear + '</p></div></div><div class="flex"><div class="eighty"><p class="--Inter-Black sub-togglable" onclick="subToggle(this)">' + company.nutrition[i].subject + ' +</p></div><div class="twenty"><p>' + company.nutrition[i].rating + '</p></div></div></div>');
       for (let j = 0; j < company.nutrition[i].subBlurbs.length; j++) {
         // const element = company.nutrition.subBlurbs[j];
         $('#tab-nutrition-content-'+i).append('<div id="tab-nutrition-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.nutrition[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.nutrition[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.nutrition[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black">Pros:</p><p class="to-format">'+ company.nutrition[i].subBlurbs[j].pros +'</p></div><div><p class"--Inter-Black">Cons:</p><p class="to-format">'+ company.nutrition[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.nutrition[i].subBlurbs[j].externalLink +'">' + company.nutrition[i].subBlurbs[j].externalSource + '</a></p></div></div>');
       }
     }
   }
   else {
     $('#tab-nutrition-content').append('No data yet');
   }

  }



  // //POST NOTE this is specific for airbnb data set - you change according to your wishes!
  // document.querySelector("#sendData").addEventListener('click', 
  //   function(event){
  //     event.preventDefault();
  //     console.log("clicked");
  //     let mData={
  //       host_name:document.querySelector("#host_name").value,
  //       nbgn_grp:document.querySelector("#neighbour_hood_group").value
      
  //     };
  //     console.log(mData);


  //     /*** request ***/
  //   $.ajax({
  //              type: "POST",
  //              data: JSON.stringify(mData),
  //              url:'/postForm',
  //              processData: false,
  //              contentType: "application/json",
  //              cache: false,
  //              timeout: 600000,
  //              success: function (response) {
  //              //reponse is a STRING
  //              console.log("we had success!");
  //              console.log(response);
              
  //             },
  //             error:function(e){
  //           console.log(e);
  //            console.log("error occurred");

  //          }
  //        });


  // });//click
// };
