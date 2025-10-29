var token = '';
var gridObj = null;
var runners = {};
var race = {};
var filteredRecords = [];
var runningGroups = [];
var gunTime = "";
var displayGunTime = "";
var stopTime = "";
var displayStopTime = "";
var exportRaceID = "25";
var raceMeta = [];


// async function getRunners(raceID) {
// 	//raceID="12";

// 	let path = "/timings/v2/runners/" + raceID;

// 	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
// 		{ path = './temp/runners.json'; }


// 	return fetch(path, {
// 		headers: {
// 			"Authorization": "Bearer " + token
// 		}
// 	})
// 		.then(response => response.json())
// 		.then(responseJson => {
// 			runners = responseJson;
// 			return responseJson
// 		});
// }

// async function getCall(path) {
// 	let state = new XMLHttpRequest();

// 	state.onload = function () {
// 		if (this.readyState == 4) {
// 			if (state.status != 200) {
// 				return;
// 			}

// 			if (this.response === '[]') {
// 				//document.getElementById("wrapper").innerHTML = "";
// 				return;
// 			}

// 			// prepareVueGridData(this.response);
// 			return "success";
// 		}
// 	};

// 	state.open("GET", path, true);
// 	state.send();
// }

// async function getResults(raceID, token) {
//if (!raceID || !token || raceID.trim() === "" || token.trim() === "")
// 	{
//     	alert("Race ID and Token are required.");
//     	return;
// 	}
// 	this.token = token;
// 	await getRunners(raceID);
// 	await getResultRace(raceID);

// 	let path = "/timings/v1/results/" + raceID;

// 	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
// 		{ path = './temp/results.json'; }

// 	let response = await getCall(path);

// 	if (response == undefined) {
// 		//	alert("Unable to retrieve data for the raceID "+ raceID);
// 		return;
// 	}
// }

async function getResultRace(raceID, token) {
	if (!raceID || !token || raceID.trim() === "" || token.trim() === "") {
		alert("Race ID and Token are required.");
		return;
	}
	alert("Get Results Called");
	let path = "/timings/v1/runs/" + raceID;
	// let path = "https://www.blingtracker.com/timings/v1/runs/" + raceID; //while test  in local use this 

	if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { path = './temp/runs.json'; }

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

	fetch("/timings/v2/runs/", {
		// fetch("https://www.blingtracker.com/timings/v2/runs/", { //while test  in local use this 
		"method": "POST",
		body: JSON.stringify(race),
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer " + token
		}
	})
		.then(response => {
			if (response.ok) {
				console.log("server response: " + response);
				alert("race updated and saved successfully");
			}
			else {
				alert("server returned error: " + response);
			}
		})
		.catch(err => {
			console.log("Error " + err);
			throw err;
		})

	// console.log(JSON.parse(race.meta).meta.result);
}
