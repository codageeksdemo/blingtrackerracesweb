 // register the runner component
      Vue.component ("runner",{
       data: function(){  return true},
       
       props: {
		    showInventory:false,
		    clientID:"",
		    input: false,
		    output: false,
			imagefile:'',
		    message1: 'No Observations!!!',
		    message2: 'No Information from the Field since last 10 minutes.',
		    message: 'test',
			selectedBlingToModify: '',
			selectedBlingToModifyIndex: -1,
		    reading: false,
		    "objects": [],
		    },
		  created: function() {
				var self = this;
			},
		   methods:{
			   getImg:	function(img) {
				return "http://www.blingtracker.com/pics/images/"+img;
				},
			   onFileChange(e) {
		      	var files = e.target.files || e.dataTransfer.files;
		      	if (!files.length)
		        	return;
		        this.defaultBling.image=URL.createObjectURL(files[0]);
				this.blings[this.selectedBlingToModifyIndex].image= this.defaultBling.image;
		        this.imagefile= files[0];
				pushImage();
		            	
		       },
		       showBling: function(e) {
		      
		      	console.log("showBling called for  "+ e.target.id);
				for(i=0;i<this.blings.length;i++)
				{
					if(this.blings[i].bMID== e.target.id)
					{
						this.selectedBlingToModifyIndex=i;
						this.selectedBlingToModify =  this.blings[i];
						this.defaultBling = Object.assign({}, this.selectedBlingToModify);
						if(this.defaultBling.image=='')
						{
							this.defaultBling.image='default.jpg';
						}
					}
				}
		      	
		 	  },
		 	  saveBling: function () {
		 	  	pushBling();
		 	  },  
		      toogleTracking: function(e) {
		      	if( this.defaultBling.track == 'T')
				{
					this.defaultBling.track='F';
				}
				else
				{
					this.defaultBling.track='T';
				}
				
				//this.saveBling();
		      },
			  closeBlingDiv: function(e){
				this.selectedBlingToModify="";
				this.selectedBlingToModifyIndex=-1;
				this.defaultBling = Object.assign({}, this.emptyBling);
		
			}
			     
		  }
		});
    
      