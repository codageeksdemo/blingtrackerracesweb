var token = '';
var gridObj = null;
var runners = {};
var race = {};
var filteredRecords = [];
var runningGroups = [];
var gunTime = "";
var displayGunTime = "";
var stopTime="";
var displayStopTime="";
var exportRaceID="25";
var raceMeta=[];

function prepareVueGridData(jsonData) {
	let received = JSON.parse(jsonData);
	//let received = [{"raceID":"2","bibID":"1","startTime":"","finishTime":"1715199155000","splits":"[\"{\\\"km\\\":5,\\\"time\\\":\\\"1715199155000\\\"}\",\"{\\\"km\\\":2.5,\\\"time\\\":\\\"1715199155000\\\"}\"]","groupR":""}];
	let data = [];
	let dataElement = [];
	let columns = [];
	let first = true;
	let index = 0;

	for (index = 0; index < received.length; index++) {
		if(received[index].bibID == '')
			continue;
		
		received[index]["finishTime"] = "";
		received[index]["splits"] = getFormattedSplits(received[index]["splits"]);

		for (var i = 0; i < runners.length; i++) {
			if (runners[i]["bibID"] === received[index]["bibID"]) {
				received[index]["name"] = runners[i]["name"];

				if (received[index]["bibID"] == "10315") {
					received[index]["age"] = 69;
				}
				else {
					received[index]["age"] = parseInt(runners[i]["age"]);
				}

				received[index]["gender"] = runners[i]["gender"];
				received[index]["raceCode"] = parseInt(runners[i]["raceCode"]);

				break;
			}
		}

		let splits = received[index]["splits"];

		/*
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

	columns=["bibID","startClockTime","finishTime","splits","name","age","gender","raceCode","laps","duration","time","categoryRank","GenderRank","overall"];
	this.runnerGrid.gridColumns = columns;
	this.runnerGrid.gridData = received;
	this.reports.columns = this.runnerGrid.gridColumns;
	this.reports.columns.push("duration");
	this.reports.columns.push("time");
	this.reports.columns.push("categoryRank");
	this.reports.columns.push("GenderRank");
	this.reports.columns.push("overall");
	this.runningGroups = JSON.parse(this.race.meta).meta.groups;
	populateFilters();
}

function processSplits1() {
	for(let a = 0; a < runnerGrid.gridData.length; a++) {
		if(runnerGrid.formFilter[runnerGrid.gridData[a].raceCode].loops == 2)
			runnerGrid.gridData[a].km = calculateKms(runnerGrid.gridData[a].splits, runnerGrid.gridData[a]);
		else if(runnerGrid.formFilter[runnerGrid.gridData[a].raceCode].loops == 1)
			runnerGrid.gridData[a].km = calculateKms_old(runnerGrid.gridData[a].splits, runnerGrid.gridData[a]);
	}
}

function processSplits() {
	let runners = runnerGrid.gridData;
	let splits = [];
	let deleteFrom = -1, toDelete = 0;
	let processParams = runnerGrid.formFilter;
	let gunTimeStamp = 0;

	for(param in processParams)
		processParams[param].minLapTimeMilliSeconds = processParams[param].minLapTime * 60 * 1000;
	
	for(let a = 0; a < runners.length; a++) {
		if(runners[a].bibID == '')
			continue;
		
		if(runners[a].splits == undefined) {
			runners[a].splits = [];
			continue;
		}
		console.group('a: ' + a);
		
		gunTimeStamp = parseInt(gunTime);
		splits = runners[a].splits;
		deleteFrom = -1;
		toDelete = 0;

		// determine splits which are before the gun time
		console.log('gun time ' +gunTime);
		splits.sort((a,b)=> {
                            if(a.time>b.time)
                                {
                                        return 1;
                                }
                            return 0;
                        });

		for(let b = 0; b < splits.length; b++) {
			console.log('splits[' + b + '].regTime ' + splits[b].registeredTime);
			if(splits[b].time < gunTimeStamp) {
				if(deleteFrom == -1)
					deleteFrom = b;
				
				toDelete++;
			}
			else
				break;
		}

		if(toDelete) {
			// if splits from 0 to toDelete - 1 are going to be deleted, then check whether the time of the split at toDelete - 1 is within the next split's time - minimum lap time
			// if it is within the minimum lap time then do not delete the split at toDelete - 1
			//if(deleteFrom == 0 && splits[toDelete - 1].time < splits[toDelete].time - processParams[runners[a].raceCode].minLapTimeMilliSeconds)
				//toDelete--;

			splits.splice(deleteFrom, toDelete);
			console.log('1 deleteFrom ' + deleteFrom + ' , toDelete ' + toDelete + ' , splits.length: ' + splits.length);
		}
	      	
		if(splits.length==0)
		{
			continue;
		}
		// set guntime if no immediate start time
		if( splits[0].time>=gunTimeStamp+10000)
		{
			let element = {};
			element["km"]=0;
			element["registeredTime"]=displayGunTime;
			element["time"]=gunTimeStamp;
			splits.unshift(element);
		}
		// determine the splits which have lesser time gap between them than the minimum lap time
		for(let b = 0; b < splits.length - 1; b++) {
			deleteFrom = -1;
			toDelete = 0;

			//console.log('diff [' + b + '+1]-[' + b + '] ' + (splits[b + 1].time - splits[b].time) + ' , minLapTime ' + processParams[runners[a].raceCode].minLapTimeMilliSeconds);

			for(c = b; c < splits.length - 1; c++) {
				if(splits[c + 1].time - splits[c].time < processParams[runners[a].raceCode].minLapTimeMilliSeconds) {
				//if(splits[c + 1].time - splits[c].time < 90000) {

				if(deleteFrom == -1)
						deleteFrom = c;
					
					toDelete++;
				}
				else
					break;
			}

			if(toDelete) {
				splits.splice(deleteFrom, toDelete);
				//b--;
			}
			
			console.log('2 deleteFrom ' + deleteFrom + ' , toDelete ' + toDelete + ' , splits.length ' + splits.length);
		}

		// determins splits which are after the stopTime

		 for(let b = 0; b < splits.length; b++) {
                        console.log('splits[' + b + '].regTime ' + splits[b].registeredTime);
                        if(splits[b].time > stopTime) {
                                if(deleteFrom == -1)
                                        deleteFrom = b;

                                toDelete++;
                        }
                }

                if(toDelete) {
                        // if splits from 0 to toDelete - 1 are going to be deleted, then check whether the time of the split at toDelete - 1 is within the next split's time - minimum lap time
                        // if it is within the minimum lap time then do not delete the split at toDelete - 1
                        //if(deleteFrom == 0 && splits[toDelete - 1].time < splits[toDelete].time - processParams[runners[a].raceCode].minLapTimeMilliSeconds)
                                //toDelete--;

                        splits.splice(deleteFrom, toDelete);
                        console.log('1 deleteFrom ' + deleteFrom + ' , toDelete ' + toDelete + ' , splits.length: ' + splits.length);
                }

		
		console.groupEnd();
		runners[a].laps=splits.length-1;
		runners[a].startClockTime = splits[0].registeredTime;
		runners[a].startTimeStamp = splits[0].time;

			runners[a].finishStamp = splits[splits.length-1].time;
			runners[a].finishTime = splits[splits.length-1].registeredTime;
			runners[a].duration = calculateDuration(runners[a].startTimeStamp, runners[a].finishStamp);

	}
	runnerGrid.gridData=runners;

}


function dateToTimeStamp(dateStr) {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes(" ")) {
    return 0; // or return null or throw custom error
  }

  var parts = dateStr.split(" ");
  var date = parts[0].split("/");
  var time = parts[1].split(":");

  var dt = new Date(
    parseInt(date[2]),
    parseInt(date[1]) - 1,
    parseInt(date[0]),
    parseInt(time[0]),
    parseInt(time[1]),
    parseInt(time[2])
  );

  return dt.getTime();
}

// function dateToTimeStamp(dt) {
// 	let [ dmy, hms ] = dt.split(' ');
// 	let [ day, month, year ] = dmy.split('/');
// 	let [ hour, minute, second ] = hms.split(':');
// 	let a = new Date;
// 	a.setDate(day);
// 	a.setMonth(month - 1);
// 	a.setFullYear(year);
// 	a.setHours(hour);
// 	a.setMinutes(minute);
// 	a.setSeconds(second);
// 	return a.getTime();
// }

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

function calculateDuration(startTime, finishTime) {
	let durationMilliSeconds = finishTime - startTime;
	let durationSeconds = Math.floor(durationMilliSeconds / 1000);
	durationMinutes = Math.floor(durationSeconds / 60);
	durationSeconds = durationSeconds % 60;
	durationHours = Math.floor(durationMinutes / 60);
	durationMinutes = durationMinutes % 60;
	return durationHours + ":" + (durationMinutes < 10 ? '0' : '') + durationMinutes + ':' + (durationSeconds < 10 ? '0' : '') + durationSeconds;
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
	record["finishStamp"] = -1;
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
			record["finishStamp"] = data[index]["time"];
			break;
		}
	}
}

function calculateKms_old(data, record) {
	let raceCode = parseInt(record["raceCode"]);

	if (data != null && data != '') {
		let totalKms = 0;
		let previousKms = 0;
		let previousTime = 0;
		let found = false;
		let setAsFinishTime = false;
		let setAsStartTime = false;
		record["readerStartTime"] = "";

		// for start time
		for (index = 0; index < data.length; index++) {
			data[index]["time"] = getEpochTime(data[index]["registeredTime"]);
		}

		data = data.sort(function (a, b) {
			return a["time"] - b["time"];
		});

		for (index = 0; index < data.length; index++) {
			let km = data[index]["km"];
			let diff = Math.abs(km - previousKms);
			data[index]["time"] = getEpochTime(data[index]["registeredTime"]);
			let diffTime = data[index]["time"] - previousTime;

			if (!setAsStartTime && runnerGrid.formFilter[record.raceCode].gunTimeStamp <= data[index]["time"] && (runnerGrid.formFilter[record.raceCode].gunTimeStamp + (1000 * 60 * runnerGrid.formFilter[record.raceCode].startTimeDelay)) >= data[index]["time"]) {
				record["readerStartTime"] = data[index]["registeredTime"];
				record["startTime"] = data[index]["time"];
				setAsStartTime = true;
			}

			if (!setAsFinishTime && previousTime != 0 && diffTime > (1000 * 60 * runnerGrid.formFilter[record.raceCode].finishTimeDelay)) {
				setAsFinishTime = true;
			}

			// totalKms = totalKms+diff;
			//if((totalKms==raceCode || setAsFinishTime )&& !found)
			if ((setAsFinishTime) && !found) {
				record["finishTime"] = data[index]["registeredTime"];
				record["finishStamp"] = data[index]["time"];
				found = true;
			}

			previousKms = km;
			previousTime = data[index]["time"];
		}

		if (record["readerStartTime"] == "") {
			record["readerStartTime"] = displayGunTime;
			record["time"] = runnerGrid.formFilter[record.raceCode].gunTimeStamp;
		}

		let minimumDuration = runnerGrid.formFilter[record.raceCode].gunTimeStamp + (1000 * 60 * runnerGrid.formFilter[record.raceCode].finishTimeDelay);

		for (index = 0; index < data.length; index++) {
			if (data[index]["time"] >= minimumDuration) {
				record["finishTime"] = data[index]["registeredTime"];
				record["finishStamp"] = data[index]["time"];
				found = true;
				break;
			}
		}

		if (record["finishTime"] == "") {
			console.log("No Finish Time ");
			// alert("No finish time");
		}

		return totalKms;
	}

	return "";
}

function getRunningGroupConfiguration(km) {
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
			record.time = split["time"];
			newSplits.push(record);
		}

		newSplits = newSplits.sort(function (a, b) {
			return a.finishStamp - b.finishStamp;
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

        fetch("/timings/v2/results/resultfile", {
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
		});
}

async function getResultRace(raceID) {
	let path = "/timings/v1/runs/" + raceID;

	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		{ path = './temp/runs.json'; }

	return fetch(path)
		.then(response => response.json())
		.then(responseJson => {
			race = responseJson;

			document.getElementById("raceEditor").style.display = "block";

document.getElementById("edit_name").value = race.name;
document.getElementById("edit_eventDate").value = race.eventDate;
document.getElementById("edit_address").value = race.address;
document.getElementById("edit_city").value = race.city;
document.getElementById("edit_photo").value = race.photo;
// document.getElementById("edit_id").value = race.id;
document.getElementById("edit_id").value = race.id;
document.getElementById("edit_email").value = race.email;
document.getElementById("edit_mobile1").value = race.mobile1;
document.getElementById("edit_mobile2").value = race.mobile2;
// document.getElementById("edit_meta").value = JSON.stringify(JSON.parse(race.meta));
var meta = JSON.parse(race.meta).meta;

	reports.metaGroups = meta.groups || [];
	reports.metaReaders = meta.readers || [];
	reports.metaResults = meta.result || [];
			
		return responseJson;
	});
}

function submitUpdatedRace() {
	console.log("submitUpdatedRace() triggered");

	// Updating the race object with input fields
	race.name = document.getElementById("edit_name").value;
	race.eventDate = document.getElementById("edit_eventDate").value;
	race.address = document.getElementById("edit_address").value;
	race.city = document.getElementById("edit_city").value;
	race.photo = document.getElementById("edit_photo").value;
	race.email = document.getElementById("edit_email").value;
	race.mobile1 = document.getElementById("edit_mobile1").value;
	race.mobile2 = document.getElementById("edit_mobile2").value;

	// Updating the race.meta field using Vue data
	race.meta = JSON.stringify({
		meta: {
			groups: reports.metaGroups,
			readers: reports.metaReaders,
			result: reports.metaResults
		}
	});

	// sending updated race data to server
	const token = document.getElementById("token").value

	fetch("https://www.blingtracker.com/timings/v2/runs/", {
		method: "POST",
		body: JSON.stringify(race),
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer " + token
		}
	})
	.then(response => {
		if(response.ok)
		{
			console.log("server response: "+ response);
			alert("race updated and saved successfully");
		}
		else{
			alert("server returned error: "+ response);
		}
	})
	.catch(err => {
		console.log("Error "+ err);
		throw err;
	})
}


function populateFilters() {
	processSplits();
	prepareDurations();
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
		rec.topMale = filterTimingsOnGender(rec.km, "M");
		rec.topFemale = filterTimingsOnGender(rec.km, "F");
		rec.topNeuter = filterTimingsOnGender(rec.km, "N");
		rec.topAll = filterTimingsOnKM(rec.km);

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
	  this.runnerGrid.gridData.sort((a,b)=> {
                            if(a.splits.length<b.splits.length)
                                {
                                        return 1;
                                }
                            return 0;
                        });
        let content = JSON.stringify(this.runnerGrid.gridData);

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

function prepareDurations() {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		el.startTime = getEpochTime(el.readerStartTime);
		el.finishStamp = getEpochTime(el.finishTime || '');

		if (el.startTime && el.finishStamp) {
			let duration = el.finishStamp - el.startTime;
			duration = duration / 1000;
			duration = duration + 1;
			el.duration = Math.floor(duration);
			newArray.push(el);
		}
		else {
			emptyDuration.push(el);
		}
	});

	newArray.sort((x, y) => {
		return x.duration - y.duration;
	});

	newArray.forEach((x) => {
		x.time = stoHMS(x.duration);
	});

	emptyDuration.forEach((x) => {
		newArray.push(x);
	});

	this.runnerGrid.gridData = newArray;
}

function filterTimings(km, gender, min, max) {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		if (el.raceCode == km &&
			el.gender == gender &&
			el.age >= min &&
			el.age <= max) {

			if (el.startTime && el.finishStamp) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});

	newArray.sort((x, y) => {
		return x.duration - y.duration;
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
			if (el.startTime && el.finishStamp) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});

	newArray.sort((x, y) => {
		return x.duration - y.duration;
	});

	let topGender = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			index++;
			topGender.push(newArray[index]);
		}

		let bibID = newArray[j].bibID;

		if (group != undefined)
			updateRecord(group.records, bibID, "GenderRank", (j + 1) + " of" + newArray.length);
	}

	return topGender;
}

function filterTimingsOnKM(group, km) {
	let newArray = [];
	let emptyDuration = [];

	this.runnerGrid.gridData.forEach((el) => {
		if (el.raceCode == km) {
			if (el.startTime && el.finishStamp) {
				newArray.push(el);
			}
			else {
				emptyDuration.push(el);
			}
		}
	});

	newArray.sort((x, y) => {
		return x.duration - y.duration;
	});

	let all = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			index++;
			all.push(newArray[index]);
		}

		let bibID = newArray[j].bibID;

		if (group != undefined)
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
				return;
			}

			if (this.response === '[]') {
				//document.getElementById("wrapper").innerHTML = "";
				return;
			}

			// prepareVueGridData(this.response);
			return "success";
		}
	};

	state.open("GET", path, true);
	state.send();
}

async function getResults(raceID, token) {
	if (!raceID || !token || raceID.trim() === "" || token.trim() === "")
	{
    	alert("Race ID and Token are required.");
    	return;
	}


	this.token = token;
	await getRunners(raceID);
	await getResultRace(raceID);

	let path = "/timings/v1/results/" + raceID;

	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		{ path = './temp/results.json'; }

	let response = await getCall(path);

	if (response == undefined) {
		//	alert("Unable to retrieve data for the raceID "+ raceID);
		return;
	}
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
