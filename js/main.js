
 var gridObj=null;
 function populate(empty)
 {
    
		
 }
 
 
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
	    console.log(`${key}: ${value}`);
	    dataElement.push(`${value}`);
	    if(first == true )
	    {
	    	columns.push(`${key}`);
	    }
	  });
	  console.log ("new element");
	  first = false;
	  data.push(dataElement);
	});
	this.timegrid.gridColumns=columns;
	this.timegrid.gridData=received;
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
					  //state.setRequestHeader("Content-Type","text/plain");
	   	    state.send();
 
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


