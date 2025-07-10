
 var gridObj=null;
 var jwt = ""; 
 function prepareVueGridData(jsonData)
 {
 	let received = JSON.parse(jsonData);
	//let received = jsonData;
	let data=[];
	let dataElement = [];
    let columns=[];
    let first = true;
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
	columns.splice(9,1);
	columns.splice(7,1);
	this.runnerGrid.gridColumns=columns;
	this.runnerGrid.gridData=received;
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
	// alert("New Runner Called")
	this.runner.display=true;
	this.runner.loadID=-2;
}

function saveRunner()
 {
 
 	pushRunnerRecord();
 	
 }

function deleteRunner(id)
 {
 	let idToDelete = this.runner.runner.id ;
 	fetch("/timings/v2/runners/"+idToDelete, {
	    "method": "DELETE",
	    headers: {
			"Content-Type": "application/json",
	        "Authorization": "Bearer "+ jwt
	    }
	})
	.then(response => {
	    if(response.ok){
	    	   	this.runnerGrid.gridData.splice(this.runner.loadID,1);
				console.log("Runner record deleted at index"+ this.runner.loadID );
				alert("Runner record is deleted successfully");
	    } else{
	        alert("Server returned Error -" + response.status + " : " + response.statusText +" \n  If this continues, you can discard and retry");
	    }
	})
	.catch(err => {
	    console.log("Error: "+ err);
	    alert("Error occured "+ err +" \n  If this continues, you can discard and retry to proceed" );
	 	throw err;
	});
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
			if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
			{
			state.open("GET", path,true);
			}
			else {
            state.open("GET", "/timings/"+path,true);
			}
			if(this.jwt!=null)
			{
				state.setRequestHeader("Authorization","Bearer "+this.jwt);	
			}
			
	   	    state.send();
 
 }
 
 async function getRunners(raceID)
 {
    jwt=document.getElementById('token').value;
    if(raceID==null || raceID == "" || jwt == null || jwt == "")
    {
		alert("Enter raceID and Token");
    	return;
    }
	 	this.runner.runner.raceID=document.getElementById('raceID').value;
	 	   this.runner.showAdd=true;

        if(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
			{ let response = await getCall('temp/runners.json'); }
		else {
  		let response = await getCall("v2/runners/"+raceID);
		}
  		if(response == undefined)
  		{
  			alert("Unable to retrieve data for the raceID "+ raceID);
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
 
function pushRunnerRecord(){
	if(this.runner.runner.id=="" && this.runner.loadID!=-2)
	{
		return;
	}
	if(this.runner.loadID==-2)
	{
		delete this.runner.runner["id"];
	}
	
	fetch("/timings/v2/runners/", {
	    "method": "POST",
	    body: JSON.stringify(this.runner.runner),
	    headers: {
			"Content-Type": "application/json",
	        "Authorization": "Bearer "+ jwt
	    }
	})
	.then(response => { 
	    if(response.ok){
	    	   	if(this.runner.loadID!=-1  || this.runner.loadID!=-2 )
				{
					this.runnerGrid.gridData.splice(this.runner.loadID,1,this.runner.runner);
				}
				else if ( this.runner.loadID==-2)
				{
					this.runnerGrid.gridData.push(this.runner.runner);
				}
				console.log("saved runner at index"+ this.runner.loadID );
				alert("Runner attributes are saved successfully");
	    } else{
	        alert("Server returned Error -" + response.status + " : " + response.statusText +" \n  If this continues, you can discard and retry");
	    }                
	})
	.catch(err => {
	    console.log("Error: "+ err);
	    alert("Error occured "+ err +" \n  If this continues, you can discard and retry to proceed" );
	 	throw err;
	});
	 
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
	fetch("/blingdemo/v1/image/annotate", {
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

function downloadCSV() {
    // const data = runnerGrid.gridData;
    // if (!data || data.length === 0) {
    //     alert("No data available to download.");
    //     return;
    // }

    const columns = runnerGrid.gridColumns;
    const csvRows = [];

	delete columns.id;

    // Add headers
    csvRows.push(columns.join(','));

    // Add rows
    // data.forEach(row => {
    //     const values = columns.map(col => `"${(row[col])}"`);
    //     csvRows.push(values.join(','));
    // });

    // const csvContent = csvRows.join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runners.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function parseCSV(csvString) {
	//if validation failed, show alert with index
	// lines should not have inverted commas [single/double] in it
        const lines = csvString.split('\n');
        const data = [];

        lines.forEach(line => {
            const values = line.split(','); // Assuming comma as delimiter
			//allowed values base on the columns
            data.push(values);
        });

        console.log("Parsed CSV Data:", data);
        // You can now work with the 'data' array

		convertCSVdatatoJSON(data);
}

function convertCSVdatatoJSON(csvData)
{
	let JSONdata =[];
	let keys = ["name","city","address","mobile1","mobile2","email","bibID","age","gender","raceCode","bMID","raceID"]
	let raceID = document.getElementById('raceID').value;

	// keys.push("raceID");

	for(let a = 1; a < csvData.length; a++)
	{
		let row = csvData[a];
		let data ={};

		for(b = 0; b < keys.length; b++)
		{
			data[keys[b]] =row[b];
		}
		data[keys[keys.length-1]] = raceID;
		JSONdata.push(data);
	}
	// prepareVueGridData(JSON.stringify(JSONdata));
	pushRunnerRecordAll(JSONdata);
}

function onFileChange(e) {
	let raceID = document.getElementById("raceID").value;
	let token = document.getElementById("token").value;
	if(raceID === undefined || raceID === "" || token === undefined || token === "")
	{
		alert("Please enter raceID and Token to Upload CSV File");
		return;
	}
	var files = e.target.files || e.dataTransfer.files;
	if (!files.length)
	{
	alert("Please upload File");
	return;
	}
	else 
	{
		alert("File uploaded");
		const reader = new FileReader();
		reader.onload = function(e) {
			const csvContent = e.target.result; // The CSV content as a string
			// Now you can process the csvContent string
			console.log(csvContent); 
			parseCSV(csvContent); // Call a function to parse the CSV data
		};
		reader.readAsText(files[0]); // Read the file as plain text
	}
}

function pushRunnerRecordAll(runnerRecord)
{
	let jwt = document.getElementById("token").value;

	fetch("/timings/v2/runners/all", {
	    "method": "POST",
	    body: JSON.stringify(runnerRecord),
	    headers: {
			"Content-Type": "application/json",
	        "Authorization": "Bearer "+ jwt
	    }
	})
	.then(response => { 
	    if(response.ok){
				alert("CSV Runner Data is saved to server succesfully");
	    } else{
	        alert("Server returned Error -" +response.statusText);
	    }                
	})
	.catch(err => {
	    console.log("Error: "+ err);
	    alert("Error occured "+ err);
	 	throw err;
	});
}