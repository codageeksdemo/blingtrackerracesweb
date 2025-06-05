
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
 	fetch("http://www.blingtracker.com/timings/v2/runners/"+idToDelete, {
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
            state.open("GET", "http://www.blingtracker.com/timings/"+path,true);
			if(this.jwt!=null)
			{
				state.setRequestHeader("Authorization","Bearer "+this.jwt);	
			}
			
	   	    state.send();
 
 }
 
 async function getRunners(raceID)
 {
    jwt=document.getElementById('token').value;
    if(raceID==null)
    {
    	return;
    }
	 	this.runner.runner.raceID=document.getElementById('raceID').value;
	 	   this.runner.showAdd=true;

        	
  		let response = await getCall("v2/runners/"+raceID);
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
 
function pushRunnerRecord(){
	if(this.runner.runner.id=="" && this.runner.loadID!=-2)
	{
		return;
	}
	if(this.runner.loadID==-2)
	{
		delete this.runner.runner["id"];
	}
	
	fetch("http://www.blingtracker.com/timings/v2/runners/", {
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


