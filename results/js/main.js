 var token='';
 var gridObj=null;
 var  runners={};
 var race={};
 var filteredRecords=[];
 var runningGroups = [];
 var gunTime="";
 var displayGunTime="";


function prepareVueGridData(jsonData)
{

  
 	let received = JSON.parse(jsonData);
	//let received = [{"raceID":"2","bibID":"1","startTime":"","finishTime":"1715199155000","splits":"[\"{\\\"km\\\":5,\\\"time\\\":\\\"1715199155000\\\"}\",\"{\\\"km\\\":2.5,\\\"time\\\":\\\"1715199155000\\\"}\"]","groupR":""}];
	let data=[];
	let dataElement = [];
    let columns=[];
    let first = true;
    
    let index = 0;
    for(index=0;index<received.length;index++)
    {

        received[index]["finishTime"]= "";
        received[index]["splits"]= getFormattedSplits(received[index]["splits"]);
      
		for ( var i = 0; i < runners.length; i++) {
				if(runners[i]["bibID"]===received[index]["bibID"])
				{
					received[index]["name"] = runners[i]["name"];
					if(received[index]["bibID"]=="10315")
					{
						received[index]["age"]= 69;

					}
					else
					{
						received[index]["age"]= parseInt(runners[i]["age"]);

					}
					received[index]["gender"]=runners[i]["gender"];
					received[index]["raceCode"]= parseInt(runners[i]["raceCode"]);

					break;
				}
		  }
      let splits = received[index]["splits"];
      if(splits)
      {
        
        received[index]["km"]= calculateKms(received[index]["splits"],received[index]);
      }	
	  }
    
	received.forEach((dataI) => {
	  dataElement = [];
	    Object.entries(dataI).forEach(([key, value]) => {
	    
	   if(first == true )
	    {
	    	columns.push(`${key}`);
	    }
		
	  });
	  first = false;
	  		
	});
	columns.splice(0,1);
	this.runnerGrid.gridColumns=columns;
	this.runnerGrid.gridData=received;
	this.reports.columns= this.runnerGrid.gridColumns;
  this.reports.columns.push("duration");
  this.reports.columns.push("time");
  this.reports.columns.push("categoryRank");
  this.reports.columns.push("GenderRank");
  this.reports.columns.push("overall");
  this.runningGroups= JSON.parse(this.race.meta).meta.groups ;
    populateFilters();
 
 }

function downloadResult() {
  let text = this.filteredRecords;
  let filename = "result_"+document.getElementById('raceID').value+".js";
  var element = document.createElement('a');
  let content = JSON.stringify(this.runnerGrid.gridData);
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


 function updateRecord(records,bibID, field,value)
 {
    records.forEach((record)=>{
        if(record.bibID==bibID)
        {
          record[field]=value;
        }
    });
 }


function calculateKms(data, record)
 {
  let raceCode = parseInt(record["raceCode"]);
	if (data != null && data!='') {
		let totalKms = 0;
		let previousKms = 0;
    let previousTime = 0;
    let found = false;
    let setAsFinishTime = false;
    let setAsStartTime = false;
    record["readerStartTime"]="";
    // for start time
		  for(index=0;index<data.length;index++)
      {
        data[index]["time"]=  getEpochTime(data[index]["registeredTime"]);
      }

      data = data.sort(function(a, b){
        return a["time"] - b["time"];
      });
    for(index=0;index<data.length;index++)
	   {

			   let km = data[index]["km"];
			   let diff = Math.abs(km - previousKms);
         data[index]["time"]=  getEpochTime(data[index]["registeredTime"]);
         let diffTime =  data[index]["time"] - previousTime;

         if(!setAsStartTime && gunTime<= data[index]["time"] && (gunTime+1000000)>= data[index]["time"])
          {
             record["readerStartTime"]= data[index]["registeredTime"];
             record["startTime"]= data[index]["time"];
             setAsStartTime=true;
          }

         if(!setAsFinishTime && previousTime!=0 && diffTime>1000000)
         {
            setAsFinishTime=true;
         }
         //         totalKms = totalKms+diff;
         //if((totalKms==raceCode  || setAsFinishTime )&& !found)
         if((setAsFinishTime )&& !found)
         {
          record["finishTime"]=data[index]["registeredTime"];
          record["finishStamp"]=data[index]["time"];
          found = true;
         }


			   previousKms = km;
         previousTime = data[index]["time"];
	   }


     if(record["readerStartTime"]=="")
      {
        record["readerStartTime"]= displayGunTime;
        record["time"]=gunTime;
      }

      let minimumDuration =  gunTime+2000000;
      for(index=0;index<data.length;index++)
        {

            if( data[index]["time"] >= minimumDuration )
            {
             record["finishTime"]=data[index]["registeredTime"];
             record["finishStamp"]=data[index]["time"];
             found = true;
             break;
            }
        }



      if(record["finishTime"]=="")
        {
		console.log("No Finish Time ");
         // alert("No finish time");
        }
	   return totalKms;

 	}

	return "";
}

function getRunningGroupConfiguration(km)
 {
    this.runningGroups.filter((g=>{
      return g.km==km;
    }))
 }


function getEpochTime(dt)
{
           let day = parseInt(dt.substring(0,2));
           let month = parseInt(dt.substring(3,5))-1;
           let year = parseInt(dt.substring(7,11))+2000;
           let hh = parseInt(dt.substring(11,13));
           let mm = parseInt(dt.substring(14,16));
           let ss = parseInt(dt.substring(17,19));
           let newDate = new Date();
           newDate.setDate= day;
           newDate.setMonth(month);
           newDate.setFullYear(year);
           newDate.setHours(hh);
           newDate.setMinutes(mm);
           newDate.setSeconds(ss);
           return newDate.getTime() +19800000;
}


function getFormattedSplits(data)
 
 {              
  		if (data != null && data!='') {
 				let splits = JSON.parse(data);
                let newSplits = [];
                let index=0;
                for(index=0;index<splits.length;index++)
                {
                        let split = splits[index];
                        let record={};
						record.km= split["km"];
						record.registeredTime = split["registeredTime"]
						record.time= split["time"];
						newSplits.push(record);
                }
				newSplits = newSplits.sort(function(a, b){
					return a.finishStamp - b.finishStamp;
				});
				
                return newSplits;
 		}
 }

 
 
 function loadRunner(id)
 {
 	let index = 0;
	this.runnerGrid.gridData.forEach((dataI) => {
	  let dataID = dataI["id"];
	  if(dataID==id.id)
	  {
	  	this.runner.runner = dataI;
	  	this.runner.display = true;
	  	this.runner.loadID=index;
	  }
	  index++;
	 });
 }

function newRunner()
{
	this.runner.display=true;
	this.runner.loadID=-2;
	this.runner.runner.raceID=document.getElementById('raceID').value;
}

function saveRunner()
 {
 
 	pushRunnerRecord();
 	
 }

 async function getRunners(raceID)
 {

        return fetch("/timings/v2/runners/"+raceID,{
                  headers: {
                         "Authorization":"Bearer "+token
                        }
                }
         )
          .then((response)=>response.json())
        .then((responseJson)=>{ runners = responseJson; return responseJson});
 }

 async function getResultRace(raceID)
 {
        return fetch("/timings/v1/runs/"+raceID)
          .then((response)=>response.json())
        .then((responseJson)=>{ 
          race = responseJson;
          let meta = JSON.parse(race.meta).meta.groups 
          displayGunTime=meta[0].gunTime;
          gunTime = getEpochTime(meta[0].gunTime);  
          return responseJson;
        });

	
 }

 
 function populateFilters()
 {

    prepareDurations();
		filteredRecords=[];
    males=[];
    females=[];
    all=[];
        let results = JSON.parse(JSON.parse(JSON.stringify(this.race))["meta"])["meta"]["result"];
        for ( var i = 0; i < results.length; i++) {
                let result = results[i];
                let km = result.km;
                let ages = result.age;
                let rec = {};
                rec.km=km;
                rec.topMale = filterTimingsOnGender(rec.km,"M");
                rec.topFemale = filterTimingsOnGender(rec.km,"F");
                rec.topNeuter = filterTimingsOnGender(rec.km,"N");
                rec.topAll = filterTimingsOnKM(rec.km);
                for(var a=0;a<ages.length;a++)
                {
                        let min = ages[a].min;
                        let max = ages[a].max;
                        let gender = ages[a].gender;
                         ages[a].records = filterTimings(rec.km,gender,min,max);
                         filterTimingsOnGender(ages[a],rec.km,gender);
                         filterTimingsOnKM(ages[a],rec.km);
                        
                }
                rec.group=ages;

                filteredRecords.push(rec);
        }

		this.reports.filteredRecords= filteredRecords;
	
 }

function stoHMS(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  //return hDisplay + mDisplay + sDisplay;
  return [h,m,s]
  .map(v => v < 10 ? "0" + v : v)
  .filter((v,i) => v !== "00" || i > 0)
  .join(":")

}

function prepareDurations()
{

       let newArray = [];
       let emptyDuration=[];
       this.runnerGrid.gridData.forEach((el)=>{
	          el.startTime= getEpochTime(el.readerStartTime);
       el.finishStamp = getEpochTime(el.finishTime);

               if(el.startTime && el.finishStamp)

                  {
                    let duration = el.finishStamp-el.startTime;
                     duration = duration/1000;
                     duration = duration+1;
			  el.duration=Math.floor(duration);
                     newArray.push(el);
                  }    
                  else{
                    emptyDuration.push(el);
                }
       });

          newArray.sort((x,y)=>{
               return x.duration - y.duration;
          });

          newArray.forEach((x)=>{
              x.time = stoHMS(x.duration);
          });

          emptyDuration.forEach((x)=>{
              newArray.push(x);
          });
          
          this.runnerGrid.gridData=newArray;
 }


function filterTimings(km,gender,min,max)
{

       let newArray = [];
       let emptyDuration=[];
       this.runnerGrid.gridData.forEach((el)=>{
               if(el.raceCode == km &&
                       el.gender == gender &&
                       el.age >= min &&
                       el.age <= max)
                       {
                           if(el.startTime && el.finishStamp)
                              {
                                newArray.push(el);
                              }    
                              else{
                                emptyDuration.push(el);
                              }
                        }
                        else{

                        }
          });

          newArray.sort((x,y)=>{
               return x.duration - y.duration;
          });

          
          
          for(j=0;j<newArray.length;j++)
            {
              let bibID=newArray[j].bibID;
              updateRecord(newArray,bibID,"categoryRank",(j+1)+" of" + newArray.length);
            }
          emptyDuration.forEach((x)=>{
              newArray.push(x);
          });
          
          return newArray;
 }

 function filterTimingsOnGender(group,km,gender)
 {

        let newArray = [];
        let emptyDuration=[];
        this.runnerGrid.gridData.forEach((el)=>{
                if(el.raceCode == km &&
                        el.gender == gender
                        )
                        {
                            if(el.startTime && el.finishStamp)
                              {
                                newArray.push(el);
                              }    
                              else{
                                emptyDuration.push(el);
                              }
                            
                              
                        }
                        else{

                        }
          });

          newArray.sort((x,y)=>{
               return x.duration - y.duration;
          });

        

          let topGender=[];
          let index=0;          

          for(j=0;j<newArray.length;j++)
            {
              if(index<20)
                {
                  index++;
                  topGender.push(newArray[index]);
                }
              let bibID=newArray[j].bibID;
              if(group!=undefined)
                updateRecord(group.records,bibID,"GenderRank",(j+1)+" of" + newArray.length);
            }
             
         
          
          return topGender;
 }

 function filterTimingsOnKM(group,km)
 {

        let newArray = [];
        let emptyDuration=[];
        this.runnerGrid.gridData.forEach((el)=>{
                if(el.raceCode == km
                        
                        )
                        {
                            if(el.startTime && el.finishStamp)
                              {
                           
                                newArray.push(el);
                              }    
                              else{
                                emptyDuration.push(el);
                              }
                            
                              
                        }
                        else{

                        }
          });

          newArray.sort((x,y)=>{
               return x.duration - y.duration;
          });

        

          let all=[];
          let index=0;          
          for(j=0;j<newArray.length;j++)
            {
              if(index<20)
              {
                index++;
                all.push(newArray[index]);
              }
              let bibID=newArray[j].bibID;
              if(group!=undefined)
                updateRecord(group.records,bibID,"overall",(j+1)+" of" + newArray.length);
            }

                   
          return all;
 }


 function generateTables()
 {
	let jsonStr = this.filteredRecords;
    var parsJson = JSON.parse(jsonStr);
    var output = '';
    for (var i = 0; i < parsJson.length; i++) {
        output += '<table border="1" style="float:left"><tr><td>' + parsJson[i]['Header'] + '</td></tr>';
        for (var j = 0; j < parsJson[i]['Values'].length; j++) {
            output += '<tr><td>' + parsJson[i]['Values'][j] + '</td></tr>';
        }
        output += '</table>';
        console.log(output);
        document.getElementById('tables').innerHTML = output;
    }
 }

 function setGuntime(km,dd,m,yy,hh,mm,ss)
 {
  
 }
 async function getCall(path)
 {
                 		
 	let state = new XMLHttpRequest();
		   state.onload = function () {
                if (this.readyState == 4) {
                		if (state.status != 200) {
	                		return;
                		}
                		if(this.response==='[]')
                		{
                			document.getElementById("wrapper").innerHTML="";
                			return;
                		}
                		prepareVueGridData(this.response);
                		return "success";
                }
            };
            state.open("GET", "/timings/"+path,true);
		
	   	    state.send();
 
 }
 
 async function getResults(raceID,token)
 {
    if(raceID==null)
    {
    	return;
    }
    this.token = token;
	  await getRunners(raceID);
		await getResultRace(raceID);
		let response = await getCall("v1/results/"+raceID);
  	
		if(response == undefined)
  		{
  		//	alert("Unable to retrieve data for the raceID "+ raceID);
  			return;
  		}
	 
	
 }



 
 
 
 async function getRaces(raceID)
 {
    //if(raceID==null)
    	
  		let response = await getCall("v1/timing/"+raceID);
  		if(response == undefined)
  		{
  		//	alert("Unable to retrieve data for the raceID "+ raceID);
  			return;
  		}
 }
 
 
 function updateImageDisplay() {
  while (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }

  const curFiles = input.files;
  if (curFiles.length === 0) {
    const para = document.createElement("p");
    para.textContent = "No files currently selected for upload";
    preview.appendChild(para);
  } else {
    const list = document.createElement("ol");
    preview.appendChild(list);

    for (const file of curFiles) {
      const listItem = document.createElement("li");
      const para = document.createElement("p");
      if (true) {
        para.textContent = `File name ${file.name}, file size ${returnFileSize(
          file.size,
        )}.`;
        const image = document.createElement("img");
        image.src = URL.createObjectURL(file);
        image.alt = image.title = file.name;

        listItem.appendChild(image);
        listItem.appendChild(para);
      } else {
        para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
        listItem.appendChild(para);
      }

      list.appendChild(listItem);
    }
  }
}
 
 
function pushImage(){
	
	var formData = new FormData();
	formData.append("image", input.files[0]);
	formData.append('bmid','1');
	let result = false;
	fetch("http://www.blingtracker.com/blingdemo/v1/image/annotate", {
		"method": "POST",
		body: formData,
		headers: {
			"Accept":"text/plain"
		}
	})
	.then((response) => response.text())
    .then((text) => {
		document.getElementById("annotations").innerHTML= text;
	})
	.catch(err => {
		console.log("Error: "+ err);
		alert("Error occured "+ err +" \n  If this continues, you can discard and close to proceed" );
		 throw err;
	});
}

function returnFileSize(number) {
  if (number < 1024) {
    return `${number} bytes`;
  } else if (number >= 1024 && number < 1048576) {
    return `${(number / 1024).toFixed(1)} KB`;
  } else if (number >= 1048576) {
    return `${(number / 1048576).toFixed(1)} MB`;
  }
 }


function getFormattedDateAndTime(startDate) {
    if (startDate != null && startDate!='') {
      var launchDate = new Date(+startDate);
       var day = launchDate.getUTCDate();
      var month = launchDate.getMonth()+1;
      var year = launchDate.getFullYear(); 
      var min = launchDate.getMinutes();
      var hour = launchDate.getHours();
      var time = launchDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
      return  day + "/" + month + "/" + year + " " + time + ""  ;
    }
    return "";
  }

 function editSplits()
  {
    alert( this.runnerGrid.searchQuery);
  }
