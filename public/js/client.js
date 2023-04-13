window.onload = function () {
  console.log("we are loaded");

  //SCANNING
  var barcodeDetector;
  var decoding = false;
  var localStream;
  var interval;
  var scannerContainer = document.querySelector(".scanner");
  var home = document.querySelector(".home");
  var startButton = document.querySelector("#startButton");
  startButton.onclick = function() {
    scannerContainer.style.display = "";
    home.style.display = "none";
    loadDevicesAndPlay();
  }
  var fileInput = document.querySelector("#fileInput")
  fileInput.onchange = function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
          
    reader.onload = function(e){
      var img = document.getElementById("selectedImg");
      img.src = e.target.result;
      img.onload = async function() {
        var detectedCodes = await barcodeDetector.detect(img);
        var json = JSON.stringify(detectedCodes, null, 2);
        console.log(json);
        alert(json);
      }
    };
      
    reader.onerror = function () {
      console.warn('oops, something went wrong.');
    };
      
    reader.readAsDataURL(file);	
  }

  var closeButton = document.querySelector("#closeButton");
  closeButton.onclick = function() {
    console.log("STOP")
    stop();
    scannerContainer.style.display = "none";
    home.style.display = "";
  }
  document.getElementsByClassName("camera")[0].addEventListener('loadeddata',onPlayed, false);
  document.getElementById("cameraSelect").onchange = onCameraChanged;
  initBarcodeDetector();


  async function initBarcodeDetector(){
    var barcodeDetectorUsable = false;
    if ('BarcodeDetector' in window) {
      let formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.length > 0) {
        barcodeDetectorUsable = true;
      }
    }

    if (barcodeDetectorUsable === true) {
      // alert('Barcode Detector supported!');
    }else{
      alert('Barcode Detector is not supported by this browser, using the Dynamsoft Barcode Reader polyfill.');
      
      BarcodeDetectorPolyfill.setLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==");
      let reader = await BarcodeDetectorPolyfill.init();
      console.log(reader); // You can modify the runtime settings of the reader instance.
      window.BarcodeDetector = BarcodeDetectorPolyfill;
    }
    
    barcodeDetector = new window.BarcodeDetector();
    
    document.getElementById("status").innerHTML = "";
  }

  function loadDevicesAndPlay(){
    var constraints = {video: true, audio: false};
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        localStream = stream;
        var cameraselect = document.getElementById("cameraSelect");
        cameraselect.innerHTML="";
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            var count = 0;
            var cameraDevices = [];
            var defaultIndex = 0;
            for (var i=0;i<devices.length;i++){
                var device = devices[i];
                if (device.kind == 'videoinput'){
                    cameraDevices.push(device);
                    var label = device.label || `Camera ${count++}`;
                    cameraselect.add(new Option(label,device.deviceId));
                    if (label.toLowerCase().indexOf("back") != -1) {
                      defaultIndex = cameraDevices.length - 1;
                    }
                }
            }

            if (cameraDevices.length>0) {
              cameraselect.selectedIndex = defaultIndex;
              play(cameraDevices[defaultIndex].deviceId);
            }else{
              alert("No camera detected.");
            }
        });

    });
  }

  function play(deviceId, HDUnsupported) {
    stop();
    var constraints = {};

    if (!!deviceId){
        constraints = {
            video: {deviceId: deviceId},
            audio: false
        }
    }else{
        constraints = {
            video: true,
            audio: false
        }
    }

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        localStream = stream;
        var camera = document.getElementsByClassName("camera")[0];
        // Attach local stream to video element
        camera.srcObject = stream;

    }).catch(function(err) {
        console.error('getUserMediaError', err, err.stack);
        alert(err.message);
    });
  }

  function stop(){
    clearInterval(interval);
    try{
        if (localStream){
            localStream.getTracks().forEach(track => track.stop());
        }
    } catch (e){
        alert(e.message);
    }
  }

  function onCameraChanged(){
    var cameraselect = document.getElementById("cameraSelect");
    var deviceId = cameraselect.selectedOptions[0].value;
    play(deviceId);
  }

  function onPlayed() {
    updateSVGViewBoxBasedOnVideoSize();
    startDecoding(); 
  }

  function updateSVGViewBoxBasedOnVideoSize(){
    var camera = document.getElementsByClassName("camera")[0];
    var svg = document.getElementsByTagName("svg")[0];
    svg.setAttribute("viewBox","0 0 "+camera.videoWidth+" "+camera.videoHeight);
  }

  function startDecoding(){
    clearInterval(interval);
    //1000/25=40
    interval = setInterval(decode, 40);
  }

  async function decode(){
    if (decoding === false) {
      console.log("decoding");
      var video = document.getElementsByClassName("camera")[0];
      decoding = true;
      var barcodes = await barcodeDetector.detect(video);
      decoding = false;
      console.log(barcodes);
      if (barcodes.length != 0) {
        let UPCcode = barcodes;
        stop();
        displayLoading(UPCcode[0].rawValue);
        scannerContainer.style.display = "none";
        home.style.display = "";
        // let detectedCode = UPCcode[0].rawValue;
        let formattedDetected;
        if (UPCcode[0].format === "upc_e") {
          if(UPCcode[0].rawValue.substring(6,7) === "0" || UPCcode[0].rawValue.substring(6,7) === "1" || UPCcode[0].rawValue.substring(6,7) === "2"){
            formattedDetected = UPCcode[0].rawValue.substring(1, 3) + UPCcode[0].rawValue.substring(6, 7) + "0000" + UPCcode[0].rawValue.substring(3, 6);
          }
          if(UPCcode[0].rawValue.substring(6,7) === "3"){
            formattedDetected = UPCcode[0].rawValue.substring(1, 4) + "00000" + UPCcode[0].rawValue.substring(4, 6);
          }
          if(UPCcode[0].rawValue.substring(6,7) === "4"){
            formattedDetected = UPCcode[0].rawValue.substring(1, 5) + "00000" + UPCcode[0].rawValue.substring(5, 6);
          }
          if(UPCcode[0].rawValue.substring(6,7) === "5" || UPCcode[0].rawValue.substring(6,7) === "6" || UPCcode[0].rawValue.substring(6,7) === "7" || UPCcode[0].rawValue.substring(6,7) === "8" || UPCcode[0].rawValue.substring(6,7) === "9"){
            formattedDetected = UPCcode[0].rawValue.substring(1, 6) + "0000" + UPCcode[0].rawValue.substring(6, 7);
          }
        }
        else if (UPCcode[0].format === "ean_13"){ 
          formattedDetected = UPCcode[0].rawValue;
        }
        else {
          formattedDetected = UPCcode[0].rawValue;
        }
        console.log(formattedDetected);
        console.log("WE HAVE A RESPONSE: " + UPCcode[0].rawValue);
        $.get(
          "/searchManualUPC",
          {UPCsubmitted : formattedDetected},
         // if we get a response from the server .... 
          function(response) {
            removeLoading();
            console.log("Mission was aborted:" + response[0]);
            if (response[0]) {
              let error = "Sorry, couldn't find anything. Try again."
              console.log(error);
              displayErrorMessage(error);
            }
            else {
              console.log("we have a response");
              removeSearchPage();
              displayResponse();
              displayItem(response[1]);
              displayCompany(response[2]);
            }
      })
      }
      // drawOverlay(barcodes);
    }
  }

  // function drawOverlay(barcodes){
  //   var svg = document.getElementsByTagName("svg")[0];
  //   svg.innerHTML = "";
  //   for (var i=0;i<barcodes.length;i++) {
  //     var barcode = barcodes[i];
  //     console.log(barcode);
  //     var lr = {};
  //     lr.x1 = barcode.cornerPoints[0].x;
  //     lr.x2 = barcode.cornerPoints[1].x;
  //     lr.x3 = barcode.cornerPoints[2].x;
  //     lr.x4 = barcode.cornerPoints[3].x;
  //     lr.y1 = barcode.cornerPoints[0].y;
  //     lr.y2 = barcode.cornerPoints[1].y;
  //     lr.y3 = barcode.cornerPoints[2].y;
  //     lr.y4 = barcode.cornerPoints[3].y;
  //     var points = getPointsData(lr);
  //     var polygon = document.createElementNS("http://www.w3.org/2000/svg","polygon");
  //     polygon.setAttribute("points",points);
  //     polygon.setAttribute("class","barcode-polygon");
  //     var text = document.createElementNS("http://www.w3.org/2000/svg","text");
  //     text.innerHTML = barcode.rawValue;
  //     text.setAttribute("x",lr.x1);
  //     text.setAttribute("y",lr.y1);
  //     text.setAttribute("fill","red");
  //     text.setAttribute("fontSize","20");
  //     svg.append(polygon);
  //     svg.append(text);
  //   }
  // }

  function getPointsData(lr){
    var pointsData = lr.x1+","+lr.y1 + " ";
    pointsData = pointsData+ lr.x2+","+lr.y2 + " ";
    pointsData = pointsData+ lr.x3+","+lr.y3 + " ";
    pointsData = pointsData+ lr.x4+","+lr.y4;
    return pointsData;
  }


  //GET DATA BY KEYWORD
  document.querySelector("#findDataWithKeyword").addEventListener('click', function(event){
    console.log("click");
    let keyword = document.getElementById("searchCritKeyword").value;
    console.log(keyword);
    displayLoading(keyword);
    $.get(
      "/searchManualKeyword",
      {keywordSubmitted : keyword},
    // if we get a response from the server .... 
      function(response) {
        removeLoading();
        console.log("Mission was aborted:" + response[0]);
        if (response[0]) {
          let error = response[response.length -1];
          console.log(error);
          displayErrorMessage(error);
        }
        else {
          removeSearchPage();
          displayResponse();
          displayItem(response[1]);
          displayCompany(response[2]);
        }
    })
  });//click

  //GET DATA BY UPC CODE
  document.querySelector("#findDataWithUPC").addEventListener('click', function(event){
    console.log("click");
    let UPCcode = document.getElementById("searchCritUPC").value;
    displayLoading(UPCcode);
    $.get(
      "/searchManualUPC",
      {UPCsubmitted : UPCcode},
     // if we get a response from the server .... 
      function(response) {
        removeLoading();
        console.log("Mission was aborted:" + response[0]);
        if (response[0]) {
          let error = "Sorry, couldn't find anything. Try again."
          console.log(error);
          displayErrorMessage(error);
        }
        else {
          removeSearchPage();
          displayResponse();
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

function handleRedo() {
  console.log("redo");
  displaySearchPage();
  removeResponse();

}

function displayLoading(e){
  let loadingPage = document.getElementById('loading-screen');
  let loadingInfo = document.getElementById('loading-screen-item');
  loadingPage.classList.remove('hidden');
  loadingInfo.textContent = e;
  $('body').bind('touchmove', function(e){e.preventDefault()})
}

function removeLoading(){
  let loadingPage = document.getElementById('loading-screen');
  loadingPage.classList.add('hidden');
  $('body').unbind('touchmove')
}

function displaySearchPage(){
  let searchPage = document.getElementById('container-search');
  searchPage.classList.remove('hidden');
}

function removeSearchPage(){
  let searchPage = document.getElementById('container-search');
  searchPage.classList.add('hidden');
}

function displayResponse(){
  let searchPage = document.getElementById('container-result');
  searchPage.classList.remove('hidden');
}

function removeResponse(){
  let searchPage = document.getElementById('container-result');
  searchPage.classList.add('hidden');
}

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
    string.replace("The company:", "");

    //split at every '>' character
    let elements = string.split('> ');

    //Put the title first (not a li element)
    //The .trim() is to remove the weird line breaks symbol from my db
    parasToFormat[i].textContent = elements[0].trim();

    //Starting at the second split element, insert each as a 'li'
    for (let j = 1; j < elements.length; j++) {    
      let li = document.createElement("li");
      li.classList.add("--Inter-Regular");
      li.classList.add("subtext");
      li.textContent = elements[j].trim();
      li.style.listStyle = 'none';
      li.style.paddingLeft = '1rem';
      li.style.textIndent = '-0.7em';

      if (parasToFormat[i].classList.contains('pros')) {
        li.insertAdjacentHTML("afterbegin", "👍 "); 
      }
      else if (parasToFormat[i].classList.contains('cons')) {
        li.insertAdjacentHTML("afterbegin", "👎 "); 
      }
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
  else {
    $('#item-image').replaceWith('<img id="item-image" src="../images/grocery.jpg" alt="">'); 
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
    $('#company-profile-nb-employees').text("+/-" + company.profile.employeesNb + " full time employees.");
    $('#company-address-1').text(company.profile.address[0]);
    $('#company-address-2').text(company.profile.address[1]);
    $('#company-address-3').text(company.profile.address[2]);

    $('#concerned-financial-year').text(company.financials.fiscalYear + "/TTM");
    $('#company-gross-revenue').text(company.financials.grossRevenue);
    $('#company-gross-profit').text(company.financials.grossProfit);
    $('#company-profit-margin span').text(company.financials.profitMargin);

    if (company.financials.payrollRatio === "") {
      $('#company-median-salary-title').css('display','none');
      $('#company-median-salary').css('display','none');
      $('#company-salary-ratio').css('display','none');
    }
    else {
      $('#company-median-salary').text(company.financials.medianWorkerPayroll);
      $('#company-salary-ratio').text("The CEO makes " + company.financials.payrollRatio + " times more than the median employee.");
    }
    
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
          $('#tab-governance-content-'+i).append('<div id="tab-governance-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.govStrategies[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.govStrategies[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.govStrategies[i].subBlurbs[j].description + '</p><div><div><p class="--Inter-Black green-title">PROS:</p><p class="to-format pros">'+ company.govStrategies[i].subBlurbs[j].pros +'</p></div><div><p class="--Inter-Black red-title">CONS:</p><p class="to-format cons">'+ company.govStrategies[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.govStrategies[i].subBlurbs[j].externalLink +'">' + company.govStrategies[i].subBlurbs[j].externalSource + '</a></p></div></div>');
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
          $('#tab-workers-content-'+i).append('<div id="tab-workers-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.workersSocialInclusion[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.workersSocialInclusion[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.workersSocialInclusion[i].subBlurbs[j].description + '</p><div><div><p class="--Inter-Black green-title">PROS:</p><p class="to-format pros">'+ company.workersSocialInclusion[i].subBlurbs[j].pros +'</p></div><div><p class="--Inter-Black red-title">CONS:</p><p class="to-format cons">'+ company.workersSocialInclusion[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.workersSocialInclusion[i].subBlurbs[j].externalLink +'">' + company.workersSocialInclusion[i].subBlurbs[j].externalSource + '</a></p></div></div>');
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
         $('#tab-environment-content-'+i).append('<div id="tab-environment-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.environment[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.environment[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.environment[i].subBlurbs[j].description + '</p><div><div><p class="--Inter-Black green-title">PROS:</p><p class="to-format pros">'+ company.environment[i].subBlurbs[j].pros +'</p></div><div><p class="--Inter-Black red-title">CONS:</p><p class="to-format cons">'+ company.environment[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.environment[i].subBlurbs[j].externalLink +'">' + company.environment[i].subBlurbs[j].externalSource + '</a></p></div></div>');
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
         $('#tab-nutrition-content-'+i).append('<div id="tab-nutrition-content-sub-blurb' + j + '" class="hidden sub-blurb"><div class="flex"><div class="eighty"><p class="--Inter-Black sub-details-togglable" onclick="subToggleDetails(this)">' + company.nutrition[i].subBlurbs[j].area + ' +</p></div><div class="twenty"><p>'+ company.nutrition[i].subBlurbs[j].rating +'</p></div></div><div class="sub-blurb-details hidden"><p>'+ company.nutrition[i].subBlurbs[j].description + '</p><div><div><p class"--Inter-Black green-title">PROS:</p><p class="to-format pros">'+ company.nutrition[i].subBlurbs[j].pros +'</p></div><div><p class="--Inter-Black red-title">CONS:</p><p class="to-format cons">'+ company.nutrition[i].subBlurbs[j].cons +'</p></div></div><p>See: <a class = "to-format-link" href="' + company.nutrition[i].subBlurbs[j].externalLink +'">' + company.nutrition[i].subBlurbs[j].externalSource + '</a></p></div></div>');
       }
     }
   }
   else {
     $('#tab-nutrition-content').append('No data yet');
   }

  }



  // //POST NOTE
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
