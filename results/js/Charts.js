	'use strict';

	window.chartColors = {
		red: 'rgb(255, 99, 132)',
		orange: 'rgb(255, 159, 64)',
		yellow: 'rgb(255, 205, 86)',
		green: 'rgb(75, 192, 192)',
		blue: 'rgb(54, 162, 235)',
		purple: 'rgb(153, 102, 255)',
		grey: 'rgb(201, 203, 207)'
	};

	(function(global) {
		var Months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];

		var xAxis = Months;

		var COLORS = [
			'#4dc9f6',
			'#f67019',
			'#f53794',
			'#537bc4',
			'#acc236',
			'#166a8f',
			'#00a950',
			'#58595b',
			'#8549ba'
		];

		var Samples = global.Samples || (global.Samples = {});
		var Color = global.Color;

		Samples.utils = {
			
			srand: function(seed) {
				this._seed = seed;
			},

			rand: function(min, max) {
				var seed = this._seed;
				min = min === undefined ? 0 : min;
				max = max === undefined ? 1 : max;
				this._seed = (seed * 9301 + 49297) % 233280;
				return min + (this._seed / 233280) * (max - min);
			},

			numbers: function(config) {
				var cfg = config || {};
				var min = cfg.min || 0;
				var max = cfg.max || 1;
				var from = cfg.from || [];
				var count = cfg.count || 8;
				var decimals = cfg.decimals || 8;
				var continuity = cfg.continuity || 1;
				var dfactor = Math.pow(10, decimals) || 0;
				var data = [];
				var i, value;

				for (i = 0; i < count; ++i) {
					value = (from[i] || 0) + this.rand(min, max);
					if (this.rand() <= continuity) {
						data.push(Math.round(dfactor * value) / dfactor);
					} else {
						data.push(null);
					}
				}

				return data;
			},

			labels: function(config) {
				var cfg = config || {};
				var min = cfg.min || 0;
				var max = cfg.max || 100;
				var count = cfg.count || 8;
				var step = (max - min) / count;
				var decimals = cfg.decimals || 8;
				var dfactor = Math.pow(10, decimals) || 0;
				var prefix = cfg.prefix || '';
				var values = [];
				var i;

				for (i = min; i < max; i += step) {
					values.push(prefix + Math.round(dfactor * i) / dfactor);
				}

				return values;
			},

			months: function(config) {
				var cfg = config || {};
				var count = cfg.count || 12;
				var section = cfg.section;
				var values = [];
				var i, value;

				for (i = 0; i < count; ++i) {
					value = Months[Math.ceil(i) % 12];
					values.push(value.substring(0, section));
				}

				return values;
			},

			color: function(index) {
				return COLORS[index % COLORS.length];
			},

			transparentize: function(color, opacity) {
				var alpha = opacity === undefined ? 0.5 : 1 - opacity;
				return Color(color).alpha(alpha).rgbString();
			}
		};

		// DEPRECATED
		window.randomScalingFactor = function() {
			return Math.round(Samples.utils.rand(-100, 100));
		};

		// INITIALIZATION

		Samples.utils.srand(Date.now());

	}(this));
	
	var colorNames = Object.keys(window.chartColors);
	
	// var color = 'blue';
	var color = Chart.helpers.color;
	function alphaColor(hex, alpha) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = hex;
    const rgba = ctx.fillStyle;
    return rgba.replace(")", `, ${alpha})`).replace("rgb", "rgba");
}

	var myBarWindow = null;
	/*
	 *  datasets: [{
	                label: 'India',
	                backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
	                borderColor: window.chartColors.red,
	                borderWidth: 1,
	                data: [
	                    1,1,1
	                ]
	 */
		var barChartData = {
	            labels: [],
	            datasets: []
	        };

	    var titleText="Chart";
		Chart.defaults.global.defaultFontColor = "black";
	    function setTitleText(text)
	    {
	    	titleText=text;
	    }

	        function loadBarChart() {
	            var ctx = document.getElementById("canvas").getContext("2d");
	            if(window.myBar) window.myBar.destroy();
	            	
	            window.myBar = new Chart(ctx, {
	                type: 'bar',
	                data: barChartData,
	                options: {
	                    responsive: true,
	                    legend: {
	                        position: 'bottom',
	                        fontweight: "bold",
                            fontSize: 15,
                            color:"blue"
	                    },
	                    title: {
	                        display: true,
	                        text: titleText,
	                        fontsize:"40px",
	                        color:"blue"
	            			
	                    },
	            scales: {
	                yAxes: [{
	                      ticks: {
	                              // Edit here for the yAxe
	                                beginAtZero:true,
	                                fontweight: "bold",
	                                fontcolor:"black",
	                                fontSize: 15
	                            }
	                        }],
	                        xAxes: [{
	                            ticks: {
	                                // Edit here for the xAxe
	                            	fontweight: "bold",
	                            	color:"blue",
	                                fontSize: 20
	                            }
	                        }]
	                    },        
				tooltips: {
			           callbacks: {
			        labelColor: function(tooltipItem, chart) {
					ontooltip(tooltipItem, chart);
					return {
			                borderColor: 'rgb(255, 0, 0)',
			                backgroundColor: 'rgb(255, 0, 0)'
			            }
			        },
			        labelTextColor:function(tooltipItem, chart){
			            return '#543453';
			        }
			    }
			  }
			 }
	            });
	            myBarWindow = window.myBar;
	        }

	        
	        function setLabels(label)
	        {
	        	barChartData.labels=label;
	        }
	        
	        function resetChart()
	        {
	        	barChartData = {
	    	            labels: [],
	    	            datasets: []
	    	        };
	           	if(window.myBar) window.myBar.destroy();
	        	
	        }
	        
	        function addToDataSet(entityid,entityvalue) {
	            var colorName = colorNames[barChartData.datasets.length % colorNames.length];
	            var dsColor = window.chartColors[colorName];
	            var newDataset = {
	                label: entityid,
	                backgroundColor: color(dsColor).alpha(0.5).rgbString(),
	                // backgroundColor: 'blue',
					borderColor: dsColor,
	                borderWidth: 1,
	                data: entityvalue
	            };
	            barChartData.datasets.push(newDataset);
	            myBarWindow.update();
	        }
			
			
	  
	        function setSize(height,width)
	        {
	        	var ctx = document.getElementById("canvas");
	        	ctx.style.height=height;
	        	ctx.style.width=width;
	        }