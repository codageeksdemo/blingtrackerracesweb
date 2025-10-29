var token = '';
var gridObj = null;
var runners = {};
var race = {};
var filteredRecords = [];
var runGroups = [];
var gunTime = "";
var displayGunTime = "";
var stopTime = "";
var displayStopTime = "";
var exportRaceID = "27";
var raceMeta = [];
var inProcess = false;
// cached meta to avoid repeated JSON.parse on race.meta
var cachedMeta = null;
var runnersByBib = null; // Map-like object for O(1) lookup by bibID
// analytics cache per km to avoid repeated sorts/filters
var analyticsCacheByKm = {};
// var runnerwithstarttime=0; //runners with starttime
// var runnerwithnostarttime=0; //runnners with no starttime or started 5 mins late than guntime, assigned guntime as starttime
// var runnerwithfinish=0;

function prepareVueGridData(jsonData) {
	inProcess = false;
	let received = JSON.parse(jsonData);
	let selected = [];
	let columns = [];
	let index = 0;

	// Build runners index once for O(1) lookup
	if (!runnersByBib || typeof runnersByBib.get !== 'function') {
		try {
			// Use Map when available; fallback to plain object
			runnersByBib = new Map();
			for (let i = 0; i < runners.length; i++) {
				const rb = runners[i];
				if (rb && rb.bibID !== undefined) runnersByBib.set(String(rb.bibID), rb);
			}
		} catch (e) {
			runnersByBib = {};
			for (let i = 0; i < runners.length; i++) {
				const rb = runners[i];
				if (rb && rb.bibID !== undefined) runnersByBib[String(rb.bibID)] = rb;
			}
		}
	}

	for (index = 0; index < received.length; index++) {
		const rec = received[index];
		if (!rec || rec.bibID === '') continue;

		rec["splits"] = getFormattedSplits(rec["splits"]);

		delete rec["startTime"];
		rec["finishTime"] = "";
		rec["finishTimeStamp"] = "";
		rec["duration"] = "";
		rec["durationInMiliSeconds"] = "";
		rec.alreadyNotified = false;

		// enrich from runners index
		let bibKey = String(rec["bibID"]);
		let rinfo = (typeof runnersByBib.get === 'function') ? runnersByBib.get(bibKey) : runnersByBib[bibKey];
		if (rinfo) {
			rec["name"] = rinfo["name"];
			rec["age"] = parseInt(rinfo["age"]);
			rec["gender"] = rinfo["gender"];
			rec["raceCode"] = parseInt(rinfo["raceCode"]);
			rec["bMID"] = rinfo["bMID"];
		}

		selected.push(rec);
	}

	columns = ["bibID", "bMID", "readerStartTime", "finishTime", "splits", "selectedSplits", "name", "age", "gender", "raceCode", "laps", "duration", "time", "categoryRank", "GenderRank", "overall", "Publish"];
	this.runnerGrid.gridColumns = columns;
	this.runnerGrid.gridData = selected;
	this.reports.columns = this.runnerGrid.gridColumns;

	// Cache meta parsing
	if (!cachedMeta && this.race && this.race.meta) {
		try { cachedMeta = JSON.parse(this.race.meta).meta; } catch (e) { cachedMeta = null; }
	}
	const groups = cachedMeta ? cachedMeta.groups : JSON.parse(this.race.meta).meta.groups;
	const results = cachedMeta ? cachedMeta.result : JSON.parse(this.race.meta).meta.result;
	this.runGroups = groups;
	this.runresults = results;

	let runnerwithstarttime = 0; // runners with starttime
	let runnerwithnostarttime = 0; // runners with no starttime
	let runnerwithfinish = 0; // runners with finish time
	let counterwasRunnerAheadOfStartTime = 0;

	let x = {};
	let chartaxisdata = { runnerwithstarttime, runnerwithnostarttime, runnerwithfinish, counterwasRunnerAheadOfStartTime };
	for (let gi = 0; gi < this.runGroups.length; gi++) {
		const g = this.runGroups[gi];
		let r = this.runresults.filter((j) => j.km == g.km);
		if (r.length === 0) {
			// preserve existing behavior but avoid spamming alerts
			continue;
		}
		x[g.km] = processSplitsNew(g, r, chartaxisdata);
	}

	populateFilters();
	loadCustomChartData(x);
}

function processSplits1(resultsdata) {
	for (let a = 0; a < runnerGrid.gridData.length; a++) {
		let totalKms = calculateKms_old(runnerGrid.gridData[a].splits, runnerGrid.gridData[a], a);
		// alert(runnerGrid.gridData[a].bibID+" total km = "+totalKms)
		console.log(missingsplits(runnerGrid.gridData[a].splits, runnerGrid.gridData[a], resultsdata))
	}
}



function dateToTimeStamp(dt) {
	let [dmy, hms] = dt.split(' ');
	let [day, month, year] = dmy.split('/');
	let [hour, minute, second] = hms.split(':');
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

	if (minutes < 10)
		minutes = '0' + minutes;

	if (seconds < 10)
		seconds = '0' + seconds;

	return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + " " +
		d.getHours() + ":" + minutes + ":" + seconds;
}

function calculateDuration(runner) {
	let startTime = runner.readerStartTimeStamp;
	let finishTime = runner.finishTimeStamp;
	if (startTime == "" || startTime == undefined || finishTime == "" || finishTime == undefined) {
		runner["durationInMiliSeconds"] = "";
		runner["duration"] = "";
	}
	else {
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
		return 0;
	});

	let clonedcollection = structuredClone(collection);
	for (let index = 0; index < clonedcollection.length; index++) {
		delete clonedcollection[index].splits;
	}

	let content = JSON.stringify(clonedcollection);


	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function prepareLapsUpdateBody() {
	let collection = [];

	this.runnerGrid.gridData.forEach((a) => {
		if (a.laps > 0) {
			let update = {};
			update["raceID"] = a.raceID;
			update["bibID"] = a.bibID;
			update["count"] = a.laps;
			update["name"] = a.name;
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

function calculateKms_old(data, record, a) {
	if (data != null && data != '') {
		let totalKms = 0;
		let previousKms = 0;

		for (let index = 0; index < data.length; index++) {
			let km = data[index]["km"];
			let diff = Math.abs(km - previousKms);
			totalKms = totalKms + diff;
			previousKms = km;
		}
		if (totalKms >= record.raceCode) {
			alert("true " + totalKms + " >= " + record.raceCode + " a= " + a)
			setFinishTime(runnerGrid.gridData[a], data[data.length - 1], true)
		}
		return totalKms;
	}
}

function missingsplits(data, record, resultsdata) {
	let idealsplitpattern = [];
	for (let a = 0; a < resultsdata.length; a++) {
		if (resultsdata[a].km == record.raceCode) {
			idealsplitpattern = resultsdata.finishsplitpattern;
		}
	}

	for (let index = 0; index < data.length; index++) {
		if (data[index]["km"] != idealsplitpattern[index]) {
			return (" runner " + record.bibID + " dont have ideal split");
		}
		else {
			return (" runner " + record.bibID + " have ideal split");
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
	let newDate = new Date(year, month, day, hh, mm, ss, 0);
	return newDate.getTime();
}

function getFormattedSplits(data) {
	if (data != null && data != '') {
		let splits = Array.isArray(data) ? data : JSON.parse(data);
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

		let lastKM = -1;
		let lastTime = "";
		let filteredSplits = [];
		for (let a = 0; a < newSplits.length; a++) {
			let spl = newSplits[a];
			if (spl.km == undefined)
				continue;

			if (spl.km != lastKM && spl.time != lastTime) {
				filteredSplits.push(spl);
				lastKm = spl.km;
				lastTime = spl.time;
			}
		}

		return filteredSplits;
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


function sendLapsUpdate() {
	this.token = document.getElementById('token').value;

	fetch("http://www.blingtracker.com/timings/v2/results/lapsupdate", {
		"method": "POST",
		body: JSON.stringify(prepareLapsUpdateBody()),
		headers: {
			"Content-Type": "application/json",
			"Accept": "*/*",
			"Authorization": "Bearer " + this.token

		}
	})

}


// function pushResult() {
// 	this.token = document.getElementById('token').value;


// 	var formData = new FormData();
// 	formData.append("raceID", exportRaceID);
// 	formData.append('text', prepareResultBody());
// 	let result = false;

// 	fetch("https://www.blingtracker.com/timings/v2/results/resultfile", {
// 		// fetch("/timings/v2/results/resultfile", {
// 		"method": "POST",
// 		body: formData,
// 		headers: {
// 			"Accept": "*/*",
// 			"Authorization": "Bearer " + this.token

// 		}
// 	})

// 		.then((response) => response.text())
// 		.then((text) => {
// 			console.log(text);
// 		})
// 		.catch(err => {
// 			console.log("Error: " + err);
// 			alert("Error occured " + err + " \n  If this continues, you can discard and close to proceed");
// 			throw err;
// 		});

// }
function pushResult() {
	const token = document.getElementById('token').value;
	const formData = new FormData();
	formData.append("raceID", exportRaceID);
	formData.append("text", prepareResultBody());

	fetch("https://www.blingtracker.com/timings/v2/results/resultfile", {
		method: "POST",
		body: formData,
		headers: {
			"Accept": "*/*",
			"Authorization": "Bearer " + token
		}
	})
		.then(async (response) => {
			// 🔹 Check for network or HTTP errors
			if (!response.ok) {
				throw new Error(`Server responded with status ${response.status}`);
			}

			const text = await response.text();

			// 🔹 Check for empty or invalid response
			if (!text || text.trim() === "") {
				alert(" No response received from the server. Please try again.");
				return;
			}

			console.log(" Server Response:", text);
			alert(" Result pushed successfully!");
		})
		.catch((err) => {
			console.error(" Error:", err);
			alert("Error occurred while pushing results:\n" + err.message +
				"\nIf this continues, you can discard and close to proceed");
			throw err;
		});
}


function prepareResultBody() {

	let collection = [];
	this.runnerGrid.gridData.sort((a, b) => {
		if (a.splits.length < b.splits.length) {
			return 1;
		}
		return 0;
	});
	this.runnerGrid.gridData.forEach((a) => {
		a.raceID = exportRaceID;
		if (a.bibID != "") {
			collection.push(a);
		}
		return 0;
	});

	let content = JSON.stringify(collection);
	return content;
}


function addSplit(splits) {
	let ele = { "km": 0, "registeredTime": "08/05/2025 06:04:02", "time": 1746664442000 }
	splits.push(ele);
}


async function getRunners(raceID) {
	//raceID="12";
	let path = "http://www.blingtracker.com/timings/v2/runners/" + raceID;

	// if(location.host == 'localhost')
	// 	path = '../../temp/runners.json';
	if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { path = './temp/runners.json'; }



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
		.catch(err => {
			console.log("Error " + err);
			alert("getRunners call failed" + err);
			throw err;
		})
}



async function getResultRace(raceID) {
	let path = "http://www.blingtracker.com/timings/v1/runs/" + raceID;
	if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { path = './temp/runs.json'; }

	return fetch(path)
		.then(response => response.json())
		.then(responseJson => {
			race = responseJson;
			// cache parsed meta once
			try { cachedMeta = JSON.parse(race.meta).meta; } catch (e) { cachedMeta = null; }
			const metaGroups = cachedMeta ? cachedMeta.groups : JSON.parse(race.meta).meta.groups;
			const resultsMeta = cachedMeta ? cachedMeta.result : JSON.parse(race.meta).meta.result;
			raceMeta = metaGroups;
			const meta = metaGroups;
			displayGunTime = meta[0].gunTime;
			gunTime = meta[0].gunTimeStamp;
			displayStopTime = meta[0].stopTime;
			stopTime = meta[0].stopTimeStamp;
			for (let gi = 0; gi < meta.length; gi++) {
				const g = meta[gi];
				const rt = resultsMeta.find(m => m.km == g.km) || {};
				runnerGrid.formFilter[g.km] = {
					gunTime: g.gunTime,
					minLapTime: rt.minlaptime,
					minFinishDuration: rt.minimumfinishduration,
					finishLoopCounts: rt.finishloopcounts
				};
				runnerGrid.filterByKms[g.km] = true;
			}

			return responseJson;
		})
		.catch(err => {
			console.log("Error " + err);
			alert("getResultRace call failed " + err);
			throw err;
		})
}


function processSplitsNew(runGroup, runresults, chartadata) {
	let runnersArr = runnerGrid.gridData;
	let splits = [];
	// Set below params (cache locally)
	const rr0 = runresults[0];
	const allowedstartdelay = rr0.allowedstartdelay;
	const minimumfinishduration = parseInt(rr0.minimumfinishduration);
	const finishloopcounts = parseInt(rr0.finishloopcounts);
	const minlaptime = parseInt(rr0.minlaptime);
	const gunTimeStamp = getEpochTime(runGroup.gunTime);
	const startWindowEnd = gunTimeStamp + allowedstartdelay;
	const finishCutoff = gunTimeStamp + minimumfinishduration;

	let runnerwithstarttime = chartadata.runnerwithstarttime;
	let runnerwithnostarttime = chartadata.runnerwithnostarttime;
	let runnerwithfinish = chartadata.runnerwithfinish;
	let counterwasRunnerAheadOfStartTime = chartadata.counterwasRunnerAheadOfStartTime;

	// avoid DOM read in loop
	let inputBibEl = document.getElementById("inputBibID");
	let inputBibID = inputBibEl ? inputBibEl.value : undefined;

	for (let a = 0; a < runnersArr.length; a++) {
		const runner = runnersArr[a];
		let wasRunnerAheadOfStartTime = false;
		let wasrunnerwithstarttime = false;
		let wasrunnerwithnostarttime = false;
		let wasrunnerwithfinish = false;
		let currentTime = 0;
		let currentFinishloopcounts = 0;

		if (!runner || runner.bibID === '' || runner.raceCode != runGroup.km) continue;

		if (!runner.splits) runner.splits = [];
		splits = runner.splits;

		// Local copies of state to reduce property lookups
		let localReaderStartTimeStamp = runner.readerStartTimeStamp;
		let localFinishTimeStamp = runner.finishTimeStamp;

		let selectedSplits = [];
		for (let b = 0; b < splits.length; b++) {
			const sb = splits[b];
			if (currentTime > 0) {
				if (sb.time - currentTime <= minlaptime) {
					sb["inference"] = "filtered for less than minlaptime";
					continue;
				}
			}

			if (sb.time < gunTimeStamp) {
				if ((gunTimeStamp - sb.time) > 999) {
					sb["inference"] = "Ahead of StartTime";
					wasRunnerAheadOfStartTime = true;
					continue;
				}
			} else if (localReaderStartTimeStamp == undefined && sb.time < startWindowEnd && sb.time >= gunTimeStamp) {
				currentTime = sb.time;
				selectedSplits.push(sb);
				sb["inference"] = "StartTime";
				setStartTime(runner, sb);
				localReaderStartTimeStamp = sb.time;
				wasrunnerwithstarttime = true;
				continue;
			} else if (localReaderStartTimeStamp == undefined && sb.time > startWindowEnd) {
				wasrunnerwithnostarttime = true;
				currentTime = sb.time;
				sb["inference"] = "No  StartTime Assigned";
				selectedSplits.push(sb);
			} else {
				currentTime = sb.time;
				selectedSplits.push(sb);
				sb["inference"] = "Selected due to intermediate ";
			}

			if (localFinishTimeStamp == "") {
				if (currentFinishloopcounts < finishloopcounts) currentFinishloopcounts++;
				if (sb.time < finishCutoff) {
					sb["inference"] = "less than minimum duration";
					continue;
				}
				if (currentFinishloopcounts == finishloopcounts) {
					wasrunnerwithfinish = true;
					setFinishTime(runner, sb, false);
					localFinishTimeStamp = sb.time;
					sb["inference"] = "FinishTime";
					break;
				} else {
					sb["inference"] = "Status:" + currentFinishloopcounts + " of " + finishloopcounts + " loops finished";
				}
			}
		}

		if (wasRunnerAheadOfStartTime) counterwasRunnerAheadOfStartTime++;
		if (wasrunnerwithnostarttime) runnerwithnostarttime++;
		if (wasrunnerwithstarttime) runnerwithstarttime++;
		if (wasrunnerwithfinish) runnerwithfinish++;
		runner.selectedSplits = selectedSplits;
	}
	runnerGrid.gridData = runnersArr;

	// restore original alert side-effect
	alert(runnerwithstarttime + " " + runnerwithnostarttime + " " + runnerwithfinish + " " + counterwasRunnerAheadOfStartTime);

	return { runnerwithstarttime, runnerwithnostarttime, runnerwithfinish, counterwasRunnerAheadOfStartTime };
}

function setStartTime(runner, split) {
	if (runner.readerStartTimeStamp != undefined) {
		console.log("ignoring the new start time due to the older one for " + runner.bibID);
		return;
	}


	//runner.laps=splits.length-1;
	runner.readerStartTime = split.registeredTime;
	runner.readerStartTimeStamp = split.time;
	console.log("Setting start Time " + runner.readerStartTime);
}


function setFinishTime(runner, split, force) {
	if (runner.finishTimeStamp != "" && force == false) {
		console.log("ignoring the new finish time due to the older one for " + runner.bibID);
		return;
	}

	runner.finishTimeStamp = split.time;
	runner.finishTime = split.registeredTime;
	calculateDuration(runner);
}


function populateFilters() {
	// Build analytics cache per km to avoid repeated sorts/filters
	analyticsCacheByKm = {};
	for (let i = 0; i < this.runnerGrid.gridData.length; i++) {
		const r = this.runnerGrid.gridData[i];
		const km = r.raceCode;
		if (km == null) continue;
		if (!analyticsCacheByKm[km]) analyticsCacheByKm[km] = { finished: [], unfinished: [], gender: { M: [], F: [], N: [] } };
		if (r.durationInMiliSeconds > 0) {
			analyticsCacheByKm[km].finished.push(r);
			if (r.gender && analyticsCacheByKm[km].gender[r.gender] !== undefined) {
				analyticsCacheByKm[km].gender[r.gender].push(r);
			}
		} else {
			analyticsCacheByKm[km].unfinished.push(r);
		}
	}
	// Sort finished arrays by duration once
	Object.keys(analyticsCacheByKm).forEach(km => {
		analyticsCacheByKm[km].finished.sort((x, y) => x.durationInMiliSeconds - y.durationInMiliSeconds);
		// gender arrays reference same objects; ensure order matches finished order
		const finished = analyticsCacheByKm[km].finished;
		const genders = analyticsCacheByKm[km].gender;
		genders.M = finished.filter(r => r.gender == 'M');
		genders.F = finished.filter(r => r.gender == 'F');
		genders.N = finished.filter(r => r.gender == 'N');
	});

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
		rec.topMale = filterTimingsOnGender(null, rec.km, "M");
		rec.topFemale = filterTimingsOnGender(null, rec.km, "F");
		rec.topNeuter = filterTimingsOnGender(null, rec.km, "N");
		rec.topAll = filterTimingsOnKM(null, rec.km);

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
	// Only sort items with valid duration to avoid NaN interactions
	this.runnerGrid.gridData.sort((x, y) => {
		const dx = x.durationInMiliSeconds || 0;
		const dy = y.durationInMiliSeconds || 0;
		return dx - dy;
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

	// Use analytics cache if present to avoid re-filtering and preserve order
	const cache = analyticsCacheByKm[km];
	if (cache && cache.gender && cache.gender[gender]) {
		newArray = cache.gender[gender].slice();
	} else {
		this.runnerGrid.gridData.forEach((el) => {
			if (el.raceCode == km && el.gender == gender) {
				if (el.durationInMiliSeconds > 0) newArray.push(el); else emptyDuration.push(el);
			}
		});
	}

	let topGender = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			topGender.push(newArray[index]);
			index++;
		}

		let bibID = newArray[j].bibID;
		if (group != undefined || group != null)
			updateRecord(group.records, bibID, "GenderRank", (j + 1) + " of" + newArray.length);
	}

	return topGender;
}

function filterTimingsOnKM(group, km) {
	let newArray = [];
	let emptyDuration = [];

	// Use analytics cache if present
	const cache = analyticsCacheByKm[km];
	if (cache && cache.finished) {
		newArray = cache.finished.slice();
	} else {
		this.runnerGrid.gridData.forEach((el) => {
			if (el.raceCode == km) {
				if (el.durationInMiliSeconds > 0) newArray.push(el); else emptyDuration.push(el);
			}
		});
		newArray.sort((x, y) => x.durationInMiliSeconds - y.durationInMiliSeconds);
	}

	let all = [];
	let index = 0;

	for (j = 0; j < newArray.length; j++) {
		if (index < 20) {
			all.push(newArray[index]);
			index++;
		}

		let bibID = newArray[j].bibID;
		if (group != undefined || group != null)
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
				alert("getCall request error " + state.response);
				return;
			}
			if (state.status == 200) {
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
	if (inProcess) {
		alert("Your request is in process, kindly wait for the response");
		return;
	}
	inProcess = true;
	if (raceID == null) {
		return;
	}

	this.token = token;
	await getRunners(raceID);
	await getResultRace(raceID);
	let path = "http://www.blingtracker.com/timings/v1/results/" + raceID;
	if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
		// path = 'http://www.blingtracker.com/timings/v1/results/35'
		path = './temp/results.json';
	}

	let response = await getCall(path);
	inProcess = false;

	path = `http://www.blingtracker.com/timings/v1/results/notified/${raceID}`;
	fetch(path)
		.then(response => response.json())
		.then(responseJson => {
			notifiedBibIDs = responseJson;
			console.log("Notified Bibs:", notifiedBibIDs);

			runnerGrid.gridData.forEach(runner => {
				runner.alreadyNotified = notifiedBibIDs.includes(String(runner.bibID));
				inProcess = false;
			});
		})
		.catch(err => {
			console.log("error in fetching notified bibids: " + err);
			throw err;
		})

}

async function getRaces(raceID) {
	//if(raceID==null)

	let response = await getCall("http://www.blingtracker.com/timings/v1/timing/" + raceID);

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

	fetch("/blingdemo/v1/image/annotate", {
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
	let headers = ["RaceName", "Kms", "BibId", "Name", "Age", "Gender", "StartTime", "FinsihTime", "Duration", "Splits"];
	let keyinrequiredsequence = ["raceID", "raceCode", "bibID", "name", "age", "gender", "readerStartTime", "finishTime", "duration", "selectedSplits"];

	let csvContent = headers.join(",") + "\n";

	collection.forEach((item) => {
		let row = keyinrequiredsequence.map(key => {
			let value = {}
			if (key != "selectedSplits") {
				value = item[key];
			}
			else if (key == "selectedSplits") {
				value = JSON.stringify(item[key]);
			}
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



