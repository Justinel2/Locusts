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
       console.log(response);
       displayItem(response[0]);
       displayCompany(response[1]);
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
         console.log(response);
         displayItem(response[0]);
         displayCompany(response[1]);
  })
});//click

function displayItem(item) {
  console.log(item);
  if (item.name != "" || item.name != undefined) {
    $('#product-name').text(item.name);
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
        $('#tab-governance-content').append('<div id="tab-governance-content-' + i + '" class="new-resource"><div class="flex"><div class="eighty"><p class="subtext">' + company.govStrategies[i].source + '</p><p>' + company.govStrategies[i].researchName + '</p></div><div class="twenty"><p>' + company.govStrategies[i].assessmentYear + '</p></div></div><div class="flex"><div class="eighty"><p class="--Inter-Black">' + company.govStrategies[i].subject + ' +</p></div><div class="twenty"><p>' + company.govStrategies[i].rating + '</p></div></div></div>');
        for (let j = 0; j < company.govStrategies[i].subBlurbs.length; j++) {
          // const element = company.govStrategies.subBlurbs[j];
          $('#tab-governance-content-'+i).append('<div class="sub-blurb active"><div class="flex"><div class="eighty"><p class="--Inter-Black">' + company.govStrategies[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.govStrategies[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details active"><p>'+ company.govStrategies[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black">Pros:</p><p class="to-format">'+ company.govStrategies[i].subBlurbs[j].pros +'</p></div><div><p class"--Inter-Black">Cons:</p><p class="to-format">'+ company.govStrategies[i].subBlurbs[j].cons +'</p></div></div><p>See: <a href="' + company.govStrategies[i].subBlurbs[j].externalLink +'">' + company.govStrategies[i].subBlurbs[j].externalSource + '</a></p></div></div>');
        }
      }

      // let parasToFormat = $('.to-format');
      // console.log(parasToFormat.text());


      // for (let i = 0; i < parasToFormat.length; i++) {
      //   let elements = parasToFormat[i].text().split('> ');
      //   parasToFormat.removeClass('to-format');
      //   parasToFormat[i].text(elements[0]);
      //   for (let j = 1; j < elements.length; j++) {     
      //     parasToFormat.parent().append('<li class="subtext">' + elements[0] + '</li>')
      //   }   
      // }


      // $('.to-format').each(function() {
      //   let newText = $(this).text().replace('> ', '\n');
      //   $(this).text(newText);
      //   // console.log($(this).parent());
      //   // let textToFormat = $(this).text().replace(/(\r\n|\n|\r)/gm, "");
      //   let textToFormat = $(this).text();
      //   console.log(textToFormat);
      //   let elements = textToFormat.split('> ');

      //   $(this).replaceWith('<p class="subtext">' + elements[0] + '</p>');

      //   for (let i = 1; i < elements.length; i++) {
      //     console.log(elements[i]);
      //     $(this).parent().append('<p>' + elements[i] + '</p>');
      //   }
      // });

    }
    else {
      $('#tab-governance-content').append('No data yet');
    }

  }



};



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
