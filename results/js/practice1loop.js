var token = '';
var gridObj = null;
var runners = {};
var race = {};
var filteredRecords = [];
var runGroups = [];
var gunTime = "";
var displayGunTime = "";
var stopTime="";
var displayStopTime="";
var exportRaceID="27";
var raceMeta=[];

// var runnerwithstarttime=0; //runners with starttime
// var runnerwithnostarttime=0; //runnners with no starttime or started 5 mins late than guntime, assigned guntime as starttime
// var runnerwithfinish=0;

function prepareVueGridData(jsonData) {
	let received = JSON.parse(jsonData);
	//let received = [{"raceID":"2","bibID":"1","startTime":"","finishTime":"1715199155000","splits":"[\"{\\\"km\\\":5,\\\"time\\\":\\\"1715199155000\\\"}\",\"{\\\"km\\\":2.5,\\\"time\\\":\\\"1715199155000\\\"}\"]","groupR":""}];
	let selected =[];
    let data = [];
	let dataElement = [];
	let columns = [];
	let first = true;
	let index = 0;

	for (index = 0; index < received.length; index++) {
		if(received[index].bibID == '')
			continue;
		
        received[index]["splits"] = getFormattedSplits(received[index]["splits"]);
        delete received[index]["startTime"];
       // received[index]["readerStartTimeStamp"] = getEpochTime(received[index]["readerStartTime"]);
        received[index]["finishTime"] = "";
        received[index]["finishTimeStamp"] = "";
        received[index]["duration"] = "";
        received[index]["durationInMiliSeconds"] = "";

        
		received[index].alreadyNotified = false;
        selected.push(received[index]);
	for (var i = 0; i < runners.length; i++) {
			if (runners[i]["bibID"] === received[index]["bibID"]) {
				received[index]["name"] = runners[i]["name"];
				received[index]["age"] = parseInt(runners[i]["age"]);
				received[index]["gender"] = runners[i]["gender"];
				received[index]["raceCode"] = parseInt(runners[i]["raceCode"]);

				break;
			}
		}

		
		/*
		let splits = received[index]["splits"];
       if (splits) {
			received[index]["km"] = calculateKms(received[index]["splits"], received[index]);
		}
		*/

	}

	/*received.forEach((dataI) => {
		dataElement = [];

		Object.entries(dataI).forEach(([key, value]) => {
			if (first == true) {
				columns.push(`${key}`);
			}
		});

		first = false;
	});*/

	columns=["bibID","readerStartTime","finishTime","splits","name","age","gender","raceCode","laps","duration","time","categoryRank","GenderRank","overall","Publish"];
	this.runnerGrid.gridColumns = columns;
	this.runnerGrid.gridData = selected;
	this.reports.columns = this.runnerGrid.gridColumns;
	this.runGroups = JSON.parse(this.race.meta).meta.groups;
	this.runresults = JSON.parse(this.race.meta).meta.result;

	let runnerwithstarttime = 0; // runners with starttime
	let runnerwithnostarttime = 0; //runners with no starttime or started 5 mins late than guntime, assigned guntime as starttime
	let runnerwithfinish = 0; // runners who were assigned finish time that is dont have finish time
	let counterwasRunnerAheadOfStartTime = 0;

	let x = {};

	let chartaxisdata = {runnerwithstarttime, runnerwithnostarttime, runnerwithfinish, counterwasRunnerAheadOfStartTime}
    this.runGroups.forEach((g)=>{
	let r =	this.runresults.filter((j)=>{
			return j.km==g.km
		})
		if(r.length === 0)
		{
			alert("r length is 0");
			return
		}
         x[g.km] = processSplitsNew(g,r, chartaxisdata);
    });
	
    populateFilters();
	loadCustomChartData(x);
	// processSplits1();
}

// function processSplits1() {
// 	for(let a = 0; a < runnerGrid.gridData.length; a++) {
// 		if(runnerGrid.formFilter[runnerGrid.gridData[a].raceCode].loops == 2)
// 			runnerGrid.gridData[a].km = calculateKms(runnerGrid.gridData[a].splits, runnerGrid.gridData[a]);
// 		else if(runnerGrid.formFilter[runnerGrid.gridData[a].raceCode].loops == 1)
// 			runnerGrid.gridData[a].km = calculateKms_old(runnerGrid.gridData[a].splits, runnerGrid.gridData[a]);
// 	}
// }

function processSplits1() {
	for(let a = 0; a < runnerGrid.gridData.length; a++)
	{
		if(runnerGrid.gridData[a].bibID==2356)
			{		
				let totalKms = calculateKms_old(runnerGrid.gridData[a].splits, runnerGrid.gridData[a], a);
				alert(runnerGrid.gridData[a].bibID+" total km = "+totalKms)
				alert(missingsplits(runnerGrid.gridData[a].splits, runnerGrid.gridData[a]))
			}
	}
}



function dateToTimeStamp(dt) {
	let [ dmy, hms ] = dt.split(' ');
	let [ day, month, year ] = dmy.split('/');
	let [ hour, minute, second ] = hms.split(':');
	let a = new Date;
	a.setDate(day);
	a.setMonth(month - 1);
	a.setFullYear(year);
	a.setHours(hour);
	a.setMinutes(minute);
	a.setSeconds(second);
	return a.getTime();
}

function timeStampToDate(ts) {
	let d = new Date(parseInt(ts / 1000) * 1000);
	let minutes = d.getMinutes();
	let seconds = d.getSeconds();

	if(minutes < 10)
		minutes = '0' + minutes;

	if(seconds < 10)
		seconds = '0' + seconds;

	return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + " " +
		d.getHours() + ":" + minutes + ":" + seconds;
}

function calculateDuration(runner) {
	let startTime =runner.readerStartTimeStamp; 
	let finishTime =runner.finishTimeStamp;
	if(startTime == "" || startTime == undefined || finishTime == "" || finishTime == undefined)
		{
			runner["durationInMiliSeconds"] = "";
			runner["duration"] = "";
		}
	else{ 	
			let durationMiliSeconds = finishTime - startTime;
			let durationSeconds = Math.floor(durationMiliSeconds / 1000);
			let durationMinutes = Math.floor(durationSeconds / 60);
			durationSeconds = durationSeconds % 60;
			let durationHours = Math.floor(durationMinutes / 60);
			durationMinutes = durationMinutes % 60;
			runner["durationInMiliSeconds"] = durationMiliSeconds;
			runner["duration"] = durationHours + ":" + (durationMinutes < 10 ? '0' : '') + durationMinutes + ':' + (durationSeconds < 10 ? '0' : '') + durationSeconds;
		}
}

function downloadResult() {
	let text = this.filteredRecords;
	let filename = "result_" + document.getElementById('raceID').value + ".js";
	var element = document.createElement('a');
	let collection = [];

	this.runnerGrid.gridData.sort((a,b)=> {
                            if(a.splits.length<b.splits.length)
                                {
                                        return 1;
                                }
                            return 0;
                        });
	 this.runnerGrid.gridData.forEach((a)=> {
                            if(a.bibID!="")
                                {
                                       collection.push(a);
                                }
                            return 0;
                        });

	let content = JSON.stringify(collection);


	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function prepareLapsUpdateBody()
{
	 let collection = [];

   this.runnerGrid.gridData.forEach((a)=> {
                            if(a.laps>0)
                                {
				       let update={};
					update["raceID"] = a.raceID;
					update["bibID"]=a.bibID;
					update["count"]=a.laps;
					update["name"]=a.name;
                                       collection.push(update);
                                }
                            return 0;
                        });
 return collection;
}


function updateRecord(records, bibID, field, value) {
	records.forEach((record) => {
		if (record.bibID == bibID) {
			record[field] = value;
		}
	});
}

function calculateKms(data, record) {
	calculateKms_old(data, record);
	record["finishTime"] = "";
	record["finishTimeStamp"] = -1;
	let currentTime = -1;
	let firstLoop = 0;

	for (index = 0; index < data.length; index++) {
		if (record["startTime"] > data[index]["time"]) {
			continue;
		}

		currentTime = data[index]["time"];

		if (firstLoop == 0 && (record["startTime"] + (1000 * 60 * runnerGrid.formFilter[record.raceCode].startTimeDelay)) < data[index]["time"]) {
			firstLoop = data[index]["time"];
		}

		if (firstLoop > 0 && ((firstLoop + (1000 * 60 * runnerGrid.formFilter[record.raceCode].finishTimeDelay)) < data[index]["time"])) {
			record["finishTime"] = data[index]["registeredTime"];
			record["finishTimeStamp"] = data[index]["time"];
			break;
		}
	}
}

// function calculateKms_old(data, record) {
// 	let raceCode = parseInt(record["raceCode"]);

// 	if (data != null && data != '') {
// 		let totalKms = 0;
// 		let previousKms = 0;
// 		let previousTime = 0;
// 		let found = false;
// 		let setAsFinishTime = false;
// 		let setAsStartTime = false;
// 		record["readerStartTime"] = "";

// 		// for start time
// 		for (index = 0; index < data.length; index++) {
// 			data[index]["time"] = getEpochTime(data[index]["registeredTime"]);
// 		}

// 		data = data.sort(function (a, b) {
// 			return a["time"] - b["time"];
// 		});

// 		for (index = 0; index < data.length; index++) {
// 			let km = data[index]["km"];
// 			let diff = Math.abs(km - previousKms);
// 			data[index]["time"] = getEpochTime(data[index]["registeredTime"]);
// 			let diffTime = data[index]["time"] - previousTime;

// 			if (!setAsStartTime && runnerGrid.formFilter[record.raceCode].gunTimeStamp <= data[index]["time"] && (runnerGrid.formFilter[record.raceCode].gunTimeStamp + (1000 * 60 * runnerGrid.formFilter[record.raceCode].startTimeDelay)) >= data[index]["time"]) {
// 				record["readerStartTime"] = data[index]["registeredTime"];
// 				record["startTime"] = data[index]["time"];
// 				setAsStartTime = true;
// 			}

// 			if (!setAsFinishTime && previousTime != 0 && diffTime > (1000 * 60 * runnerGrid.formFilter[record.raceCode].finishTimeDelay)) {
// 				setAsFinishTime = true;
// 			}

// 			// totalKms = totalKms+diff;
// 			//if((totalKms==raceCode || setAsFinishTime )&& !found)
// 			if ((setAsFinishTime) && !found) {
// 				record["finishTime"] = data[index]["registeredTime"];
// 				record["finishStamp"] = data[index]["time"];
// 				found = true;
// 			}

// 			previousKms = km;
// 			previousTime = data[index]["time"];
// 		}

// 		if (record["readerStartTime"] == "") {
// 			record["readerStartTime"] = displayGunTime;
// 			record["time"] = runnerGrid.formFilter[record.raceCode].gunTimeStamp;
// 		}

// 		let minimumDuration = runnerGrid.formFilter[record.raceCode].gunTimeStamp + (1000 * 60 * runnerGrid.formFilter[record.raceCode].finishTimeDelay);

// 		for (index = 0; index < data.length; index++) {
// 			if (data[index]["time"] >= minimumDuration) {
// 				record["finishTime"] = data[index]["registeredTime"];
// 				record["finishStamp"] = data[index]["time"];
// 				found = true;
// 				break;
// 			}
// 		}

// 		if (record["finishTime"] == "") {
// 			console.log("No Finish Time ");
// 			// alert("No finish time");
// 		}

// 		return totalKms;
// 	}
// 	return "";
// }

function calculateKms_old(data, record, a)
{
	if(data != null && data != '')
	{
		let totalKms = 0;
		let previousKms = 0;

		for(let index =0; index<data.length; index++)
		{
			let km = data[index]["km"];
			let diff = Math.abs(km - previousKms);
			totalKms = totalKms+diff;
			previousKms = km;
		}
		if(totalKms >= record.raceCode)
		{
			alert("true "+totalKms+" >= "+record.raceCode+" a= "+a)
			setFinishTime(runnerGrid.gridData[a], data[data.length-1], true)
		}
		return totalKms;
	}
}

function missingsplits(data, record)
{
	let idealsplitpattern = [0,1,5,0];
	
	for(let index = 0; index<data.length; index++)
	{
		if(data[index]["km"] != idealsplitpattern[index])
		{
			return(" runner "+record.bibID+" dont have ideal split");
		}
		else
		{
			return(" runner "+record.bibID+" have ideal split");
		}
	}
}

function getRunGroupConfiguration(km) {
	this.runningGroups.filter((g => {
		return g.km == km;
	}))
}

function getEpochTime(dt) {
	let day = parseInt(dt.substring(0, 2));
	let month = parseInt(dt.substring(3, 5)) - 1;
	let year = parseInt(dt.substring(7, 11)) + 2000;
	let hh = parseInt(dt.substring(11, 13));
	let mm = parseInt(dt.substring(14, 16));
	let ss = parseInt(dt.substring(17, 19));
	let newDate = new Date();
	newDate.setDate = day;
	newDate.setMonth(month);
	newDate.setFullYear(year);
	newDate.setHours(hh);
	newDate.setMinutes(mm);
	newDate.setSeconds(ss);
	  return newDate.getTime() + 19800000;
}

function getFormattedSplits(data) {
	if (data != null && data != '') {
		let splits = JSON.parse(data);
		let newSplits = [];
		let index = 0;

		for (index = 0; index < splits.length; index++) {
			let split = splits[index];
			let record = {};
			record.km = split["km"];
			record.registeredTime = split["registeredTime"]
			record.time = getEpochTime(record.registeredTime);
			newSplits.push(record);
		}

		newSplits = newSplits.sort(function (a, b) {
			return a.time - b.time;
		});

		return newSplits;
	}
}

function loadRunner(id) {
	let index = 0;

	this.runnerGrid.gridData.forEach((dataI) => {
		let dataID = dataI["id"];

		if (dataID == id.id) {
			this.runner.runner = dataI;
			this.runner.display = true;
			this.runner.loadID = index;
		}

		index++;
	});
}

function newRunner() {
	this.runner.display = true;
	this.runner.loadID = -2;
	this.runner.runner.raceID = document.getElementById('raceID').value;
}

function saveRunner() {
	pushRunnerRecord();
}


function sendLapsUpdate()
{
	this.token=document.getElementById('token').value;

        fetch("/timings/v2/results/lapsupdate", {
    "method": "POST",
    body: JSON.stringify(prepareLapsUpdateBody()),
    headers: {
                "Content-Type": "application/json",
        "Accept":"*/*",
	     "Authorization": "Bearer " + this.token

    }
  })

}


function pushResult()
{
        this.token=document.getElementById('token').value;


		var formData = new FormData();
        formData.append("raceID", exportRaceID);
        formData.append('text', prepareResultBody());
        let result = false;

		fetch("https://www.blingtracker.com/timings/v2/results/resultfile", {
        // fetch("/timings/v2/results/resultfile", {
                "method": "POST",
                body: formData,
                headers: {
                "Accept":"*/*",
             "Authorization": "Bearer " + this.token

                         }})

                .then((response) => response.text())
                .then((text) => {
                	console.log(text);
                })
                .catch(err => {
                        console.log("Error: " + err);
                        alert("Error occured " + err + " \n  If this continues, you can discard and close to proceed");
                        throw err;
                });

}

function prepareResultBody()
	{

	let collection=[];
	 this.runnerGrid.gridData.sort((a,b)=> {
                            if(a.splits.length<b.splits.length)
                                {
                                        return 1;
                                }
                            return 0;
                        });
         this.runnerGrid.gridData.forEach((a)=> {
		 	    a.raceID= exportRaceID;	
                            if(a.bibID!="")
                                {
                                       collection.push(a);
                                }
                            return 0;
                        });

        let content = JSON.stringify(collection);
        return content;
	}


  function addSplit(splits){
                        let ele = {"km":0,"registeredTime":"08/05/2025 06:04:02","time":1746664442000} 
                        splits.push(ele);
                }


async function getRunners(raceID) {
	//raceID="12";
	let path = "/timings/v2/runners/" + raceID;

	// if(location.host == 'localhost')
	// 	path = '../../temp/runners.json';
	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		{ path = './temp/runners.json'; }

	

	return fetch(path, {
		headers: {
			"Authorization": "Bearer " + token
		}
	})
		.then(response => response.json())
		.then(responseJson => {
			runners = responseJson;
			return responseJson
		})
		.catch(err =>{
			console.log("Error "+err);
			alert("getRunners call failed"+err);
			throw err;
		})
}

async function getResultRace(raceID) {
	let path = "/timings/v1/runs/" + raceID;

	// if(location.host == 'localhost')
	// 	path = '../../temp/runs.json';
	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		{ path = './temp/runs.json'; }


	return fetch(path)
		.then(response => response.json())
		.then(responseJson => {
			race = responseJson;
			raceMeta = JSON.parse(race.meta).meta.groups;
			meta = raceMeta;
			displayGunTime = meta[0].gunTime;
			gunTime = meta[0].gunTimeStamp;
			displayStopTime= meta[0].stopTime;
			stopTime = meta[0].stopTimeStamp;
			for(group in meta) {
				runnerGrid.formFilter[meta[group].km] = {
					// gunTime: meta[group].gunTime,
					// minLapTime: 1,
					// laps: 1
				};

				runnerGrid.filterByKms[meta[group].km] = true;
			}

			return responseJson;
		})
		.catch(err =>{
			console.log("Error "+err);
			alert("getResultRace call failed "+err);
			throw err;
		})
}


function processSplitsNew(runGroup, runresults, chartadata) {
	let runners = runnerGrid.gridData;
	let splits = [];
    // Set below params

	let allowedstartdelay = runresults[0].allowedstartdelay;
	let oneloopduration = runresults[0].oneloopduration;
	let minimumfinishduration = runresults[0].minimumfinishduration;
	let finishloopcounts = runresults[0].finishloopcounts;
	let minlaptime = runresults[0].minlaptime;

	let runnerwithstarttime = chartadata.runnerwithstarttime;
	let runnerwithnostarttime = chartadata.runnerwithnostarttime;
	let runnerwithfinish = chartadata.runnerwithfinish;
	let counterwasRunnerAheadOfStartTime = chartadata.counterwasRunnerAheadOfStartTime;
	
	let gunTime = runGroup.gunTime;
	let gunTimeStamp = getEpochTime(runGroup.gunTime);

	for(let a = 0; a < runners.length; a++) {

	let wasRunnerAheadOfStartTime = false;
	let wasrunnerwithstarttime = false;
	let wasrunnerwithnostarttime = false;
	let wasrunnerwithfinish = false;

	if(runners[a].bibID == '' || runners[a].raceCode!=runGroup.km)
        {    
			continue;
        }
		console.group('a: ' + runners[a].bibID);
		
        if(runners[a].splits==undefined)
        {
            runners[a].splits=[];
        }
		splits = runners[a].splits;
		let deleteFrom = -1;
		let toDelete = 0;
		
		// determine the splits which have lesser time gap between them than the minimum lap time
		for(let b = 0; b < splits.length - 1; b++) {
			deleteFrom = -1;
			toDelete = 0;

			//console.log('diff [' + b + '+1]-[' + b + '] ' + (splits[b + 1].time - splits[b].time) + ' minLapTime ' + processParams[runners[a].raceCode].minLapTimeMilliSeconds);

			// for(c = b; c < splits.length - 1; c++) {
			// 	if(splits[c + 1].time - splits[c].time < minlaptime) {

			// 	if(deleteFrom == -1)
			// 			deleteFrom = c;

			// 		toDelete++;
			// 	}
			// 	else
			// 		break;
			// }

			if(toDelete) {
				splits.splice(deleteFrom, toDelete);
				//b--;
			}

			console.log('deleteFrom ' + deleteFrom + ' , toDelete ' + toDelete + ' from splits.length ' + splits.length);
		}

		// determine splits which are before the gun time
		splits.sort((a,b)=> {
                            if(a.time>b.time)
                                {
                                        return 1;
                                }
                            return 0;
                        });

		for(let b = 0; b < splits.length; b++) {
			if(runners[a].bibID=="2182")
			{
					// alert( "called");

			}

			 if(splits[b].time < gunTimeStamp) {
				let diff = gunTimeStamp - splits[b].time;
				if(diff>999)
					{
					console.log("ignoring "+ splits[b].time + "as it is lesser than "+ gunTimeStamp );
					wasRunnerAheadOfStartTime = true;
					continue;
					}
			}
			else if(runners[a].readerStartTimeStamp==undefined && splits[b].time<gunTimeStamp +allowedstartdelay && splits[b].time>=gunTimeStamp) // upto 300 seconds after guntime
			{
				setStartTime(runners[a],splits[b]);
				wasrunnerwithstarttime = true;
				// runnerwithstarttime = runnerwithstarttime+1;
				continue;
			} 
			 else if(runners[a].readerStartTimeStamp==undefined && splits[b].time>gunTimeStamp +allowedstartdelay) // above 600  seconds 
                        {
                                // set guntime as start time

                                // let spl ={};
                                // spl["km"] = 0;
                                // spl["registeredTime"] = gunTime;
                                // spl["time"] =  gunTimeStamp;
                                // setStartTime(runners[a],spl);

								wasrunnerwithnostarttime = true;
								// runnerwithnostarttime = runnerwithnostarttime+1;

                                // continue;
                        }

			if(runners[a].finishTimeStamp=="" && splits[b].time>gunTimeStamp +minimumfinishduration) // upto 30 min seconds finishtime
                        {
							//&& b== finishloopcounts
								// set guntime as start time

								wasrunnerwithfinish = true;
								// runnerwithfinish = runnerwithfinish + 1;

								setFinishTime(runners[a],splits[b], false);
                                break;
								
                        }	
		}

				// if(wasRunnerAheadOfStartTime==true)
				// {
				// 				let spl ={};
                //                 spl["km"] = 0;
                //                 spl["registeredTime"] = gunTime;
                //                 spl["time"] =  gunTimeStamp;
                //                 setStartTime(runners[a],spl);
				// }
		console.log(runners[a]);
		console.groupEnd();
	
		if (wasRunnerAheadOfStartTime) counterwasRunnerAheadOfStartTime++;
		if (wasrunnerwithnostarttime) runnerwithnostarttime++;
		if (wasrunnerwithstarttime) runnerwithstarttime++;
		if (wasrunnerwithfinish) runnerwithfinish++;

	}
	runnerGrid.gridData=runners;

	alert(runnerwithstarttime+" "+runnerwithnostarttime+" "+runnerwithfinish+" "+counterwasRunnerAheadOfStartTime);

	let chrtdata = {runnerwithstarttime, runnerwithnostarttime, runnerwithfinish, counterwasRunnerAheadOfStartTime};
	return chrtdata;
}

function setStartTime(runner,split)
{
		if(runner.readerStartTimeStamp!=undefined)
		{
			console.log("ignoring the new start time due to the older one for "+ runner.bibID);
			return;
		} 


		//runner.laps=splits.length-1;
		runner.readerStartTime=split.registeredTime;
		runner.readerStartTimeStamp = split.time;
		console.log("Setting start Time "+ runner.readerStartTime );
}


function setFinishTime(runner,split,force)
{
		if(runner.finishTimeStamp!="" && force == false )
		{
			console.log("ignoring the new finish time due to the older one for "+ runner.bibID);
			return;
		}

		runner.finishTimeStamp = split.time;
		runner.finishTime = split.registeredTime;
        calculateDuration(runner);
}


function populateFilters() {
	
	sortOnDurations();
	filteredRecords = [];
	males = [];
	females = [];
	all = [];
	let results = JSON.parse(JSON.parse(JSON.stringify(this.race))["meta"])["meta"]["result"];

	for (var i = 0; i < results.length; i++) {
		let result = results[i];
		let km = result.km;
		let ages = result.age;
		let rec = {};
		rec.km = km;
		rec.topMale = filterTimingsOnGender(null,rec.km, "M");
		rec.topFemale = filterTimingsOnGender(null,rec.km, "F");
		rec.topNeuter = filterTimingsOnGender(null,rec.km, "N");
		rec.topAll = filterTimingsOnKM(null,rec.km);

		for (var a = 0; a < ages.length; a++) {
			let min = ages[a].min;
			let max = ages[a].max;
			let gender = ages[a].gender;
			ages[a].records = filterTimings(rec.km, gender, min, max);
			filterTimingsOnGender(ages[a], rec.km, gender);
			filterTimingsOnKM(ages[a], rec.km);
		}

		rec.group = ages;
		filteredRecords.push(rec);
	}

	this.reports.filteredRecords = filteredRecords;
	sortOnDurations();  

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

	return [h, m, s]
		.map(v => v < 10 ? "0" + v : v)
		.filter((v, i) => v !== "00" || i > 0)
		.join(":")
}

function sortOnDurations() {



	this.runnerGrid.gridData.sort((x, y) => {
		return x.durationInMiliSeconds - y.durationInMiliSeconds;
	});

}


function filterTimings(km, gender, min, max) {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		if (el.raceCode == km &&
			el.gender == gender &&
			el.age >= min &&
			el.age <= max) {

			if (el.durationInMiliSeconds) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});

	newArray.sort((x, y) => {
		return x.durationInMiliSeconds - y.durationInMiliSeconds;
	});

	for (j = 0; j < newArray.length; j++) {
		let bibID = newArray[j].bibID;
		updateRecord(newArray, bibID, "categoryRank", (j + 1) + " of" + newArray.length);
	}

	emptyDuration.forEach((x) => {
		newArray.push(x);
	});

	return newArray;
}

function filterTimingsOnGender(group, km, gender) {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		if (el.raceCode == km &&
			el.gender == gender
		) {
			if (el.durationInMiliSeconds>0) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});


	let topGender = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			// index++;
			topGender.push(newArray[index]);
			index++;
		}

		let bibID = newArray[j].bibID;

		if (group != undefined || group !=null )
			updateRecord(group.records, bibID, "GenderRank", (j + 1) + " of" + newArray.length);
	}

	return topGender;
}

function filterTimingsOnKM(group, km) {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		if (el.raceCode == km) {
			if (el.durationInMiliSeconds>0) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});


	newArray.sort((x, y) => {
		return x.durationInMiliSeconds - y.durationInMiliSeconds;
	});

	let all = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			// index++;
			all.push(newArray[index]);
			index++;
		}

		let bibID = newArray[j].bibID;

		if (group != undefined || group !=null)
			updateRecord(group.records, bibID, "overall", (j + 1) + " of" + newArray.length);
	}

	return all;
}

function generateTables() {
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

function setGuntime(km, dd, m, yy, hh, mm, ss) {
}

async function getCall(path) {
	let state = new XMLHttpRequest();

	state.onload = function () {
		if (this.readyState == 4) {
			if (state.status != 200) {
				alert("getCall request error "+state.response);
				return;
			}
			if(state.status == 200)
			{
				alert("getCall request success");
			}
			
			if (this.response === '[]') {
				//document.getElementById("wrapper").innerHTML = "";
				return;
			}
			
			//console.log(this.response)
			prepareVueGridData(this.response);
			return "success";
		}
	};

	state.open("GET", path, true);
	state.send();
}

async function getResults(raceID, token) {
	if (raceID == null) {
		return;
	}

	this.token = token;
	await getRunners(raceID);
	await getResultRace(raceID);

	let path = "/timings/v1/results/" + raceID;
	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		{ 
			// path = 'http://www.blingtracker.com/timings/v1/results/35'
			path = './temp/results.json';
		} 

	let response = await getCall(path);
	
	// try {

    // 	const notifyResponse = await fetch(`/timings/v1/results/notified/${raceID}`);
	// 	const notifiedBibIDs = await notifyResponse.json();

	// 	console.log("Notified Bibs:", notifiedBibIDs);

	// 	runnerGrid.gridData.forEach(runner => {
	// 		runner.alreadyNotified = notifiedBibIDs.includes(String(runner.bibID));
	// 	});
	// } catch (error) {
	// 	console.error("Error fetching notified bibs:", error);
	// }

	path = `/timings/v1/results/notified/${raceID}`;
	fetch(path)
		.then(response => response.json())
		.then(responseJson => {
			notifiedBibIDs = responseJson;
			console.log("Notified Bibs:", notifiedBibIDs);

			runnerGrid.gridData.forEach(runner => {
			runner.alreadyNotified = notifiedBibIDs.includes(String(runner.bibID));
		});
		})
		.catch(err =>{
			console.log("error in fetching notified bibids: "+err);
			throw err;
		})

}

async function getRaces(raceID) {
	//if(raceID==null)

	let response = await getCall("/timings/v1/timing/" + raceID);

	if (response == undefined) {
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
	}
	else {
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
			}
			else {
				para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
				listItem.appendChild(para);
			}

			list.appendChild(listItem);
		}
	}
}

function pushImage() {
	var formData = new FormData();
	formData.append("image", input.files[0]);
	formData.append('bmid', '1');
	let result = false;

	fetch("http://www.blingtracker.com/blingdemo/v1/image/annotate", {
		"method": "POST",
		body: formData,
		headers: {
			"Accept": "text/plain"
		}
	})
		.then((response) => response.text())
		.then((text) => {
			document.getElementById("annotations").innerHTML = text;
		})
		.catch(err => {
			console.log("Error: " + err);
			alert("Error occured " + err + " \n  If this continues, you can discard and close to proceed");
			throw err;
		});
}

function returnFileSize(number) {
	if (number < 1024) {
		return `${number} bytes`;
	}
	else if (number >= 1024 && number < 1048576) {
		return `${(number / 1024).toFixed(1)} KB`;
	}
	else if (number >= 1048576) {
		return `${(number / 1048576).toFixed(1)} MB`;
	}
}

function getFormattedDateAndTime(startDate) {
	if (startDate != null && startDate != '') {
		var launchDate = new Date(+startDate);
		var day = launchDate.getUTCDate();
		var month = launchDate.getMonth() + 1;
		var year = launchDate.getFullYear();
		var min = launchDate.getMinutes();
		var hour = launchDate.getHours();
		var time = launchDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
		return day + "/" + month + "/" + year + " " + time + "";
	}

	return "";
}

function editSplits() {
	alert(this.runnerGrid.searchQuery);
}

function loadCustomChartData(chartdata) {
	resetChart();
    setLabels(["runners ahead of start time", "runners with no starttime", "runners with allowed starttime after guntime", "runners with no finish time", "runners with finish time"]);
    setTitleText("Runner Analysis");
	setSize("400px", "800px");
	loadBarChart();

	for (let num in chartdata) {
        const item = chartdata[num];

        const runnerwithnostarttime = item.runnerwithnostarttime || 0;
        const runnerwithstarttime = item.runnerwithstarttime || 0;

		let total = runnerwithnostarttime + runnerwithstarttime;
        const runnerwithnofinish = (total - item.runnerwithfinish || 0);

		const counterwasRunnerAheadOfStartTime = item.counterwasRunnerAheadOfStartTime || 0;
		const runnerwithfinish = item.runnerwithfinish || 0;

        addToDataSet(`${num}K runners`, [counterwasRunnerAheadOfStartTime, runnerwithnostarttime, runnerwithstarttime, runnerwithnofinish, runnerwithfinish]);
    }
}

function downloadResultCSV() {
	let filename = "result_" + document.getElementById('raceID').value + ".csv";
	let collection = [];

	this.runnerGrid.gridData.sort((a, b) => {
		if (a.splits.length < b.splits.length) {
			return 1;
		}
		return 0;
	});

	this.runnerGrid.gridData.forEach((a) => {
		if (a.bibID != "") {
			collection.push(a);
		}
	});

	// let headers = Object.keys(collection[0] || {}).filter(key => key !== 'splits');
	let headers = ["RaceName","Kms","BibId","Name","Age","Gender","StartTime","FinsihTime","Duration"];
	let keyinrequiredsequence = ["raceID","raceCode","bibID","name","age","gender","readerStartTime","finishTime","duration"];
	
	let csvContent = headers.join(",") + "\n";

	collection.forEach((item) => {
		let row = keyinrequiredsequence.map(key => {
			let value = item[key];

			return value; // Number, null, or others
		});
		csvContent += row.join(",") + "\n";
	});

	let element = document.createElement('a');
	element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}



