	/*
	
	Name: TR-LAB PEP PROPERTY INTERACTIVE - HORIZONTAL BAR CHARTS
    End Use: ODI CONFERENCE NOV 1 2016
	Developer: J BAYLISS
	From/to: Oct 12 2016 to ... 
	Technologies: D3.js, Javascript.js, D3.js, Chosen.js, Bootstrap.js, Less.js

	*/



	// initialise global variables.
	var map = $('#map'); // set variable to DOM element to contain map
	var mapInfo = $('#mapInfo'); // set variable to DOM element to contain graphic
	var graphic = $('#graphic'); // set variable to DOM element to contain graphic
	var graphic0 = $('#graphic0'); // set variable to DOM element to contain graphic
	var graphic1 = $('#graphic1'); // set variable to DOM element to contain graphic
	var graphic2 = $('#graphic2'); // set variable to DOM element to contain graphic
	var graphic3 = $('#graphic3'); // set variable to DOM element to contain graphic
	var hyper0 = $("#graphicfooter0")
	var hyper1 = $("#graphicfooter1")
	var hyper2 = $("#graphicfooter2")
	var hyper3 = $("#graphicfooter3")
	var footer = $('#footer'); // set variable to DOM element to contain graphic
	var vis = {}; // global object variable to contain all variables prefixed with 'vis.'	
	vis.xData = [];// clear and reanitialise arrays for containing data values for x and y variables	
	vis.yData = [];
	
	// define and construct x axis domain and ranges
	var LADS = [];
	var LADCodes = [];

	var svgWidth;
	var svgHeight;
	var num_ticksx; // initialise car to contain number of ticks for x axis
	var num_ticksy; // initialise car to contain number of ticks for y axis	

	var pymChild = null; // initial Pym variable
	
				
	var myData = {};
				             
	var svg; // svg container
			
	// broswer use checking ... need this to resovle issue with tooltip not locating precisely in FireFox.			
	var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
	var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
	var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"
	var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
	var isIE = /*@cc_on!@*/false || !!document.documentMode;   // At least IE6		

	var output = 'Detecting browsers by ducktyping:		';
	output += 'isFirefox: ' + isFirefox + '		';
	output += 'isChrome: ' + isChrome + '		';
	output += 'isSafari: ' + isSafari + '		';
	output += 'isOpera: ' + isOpera + '		';
	output += 'isIE: ' + isIE + '		';

	var graphCode;
	var graphIndex;
	var graphic_data = {};
	var xMax = -1;
	var yMax = -1;
	var xAxisMax = -1;
	
	var groups;
	
	

	 
	 var xRoundedAxisLimits =  [
	 							[ 500, 500 ],
								[ 500, 500 ]
							];

	queue()
		.defer(onLoad)
		.await(drawGraphic);

	
	
	function onLoad(){

		//then, onload, check to see if the web browser can handle 'inline svg'
		if (Modernizr.inlinesvg)
		{
			
			// open and load configuration file. 					
			d3.json("data/config.json", function(error, json)
			{	
									
				// store read in json data from config file as as global vis. variable ...	
				vis.config = json;

				// axis limit selection variable ... initialises to first element of "axisLimits" array in config file 
				vis.selectedAxisLimitVariable = "Data";	
				vis.limitTypeIndex = vis.config.vars.axisLimits.indexOf(vis.selectedAxisLimitVariable);
			
				vis.graphic_data_full = {};
				vis.fileReadCount = 0;
				
				vis.selectedFile = "data0";
				vis.selectedFileIndex = 0;
				
				vis.config.vars.graphic_data_url.forEach(function(d,i){
					
					var objName = d;
					graphic_data_url = "data/" + objName + ".csv";
					
					//load chart data
					d3.csv(graphic_data_url, function(error, data) {
						graphic_data_interim = data;
						
						vis.graphic_data_full[objName] = graphic_data_interim;
						
						LADS = [];
						LADCodes = [];
						
						graphic_data_interim.forEach(function(d,i){
							LADS.push(d.name);
							LADCodes.push(d.code);
						})
					
													
						vis.fileReadCount++;
						if ( vis.fileReadCount == vis.config.vars.graphic_data_url.length ) {
							
							buildUI();
							pymChild = new pym.Child({renderCallback: drawGraphic});
						}
					})						
				})	

			})// end 

		} // end if ... 
		else {


			//use pym to create iframe containing fallback image (which is set as default)
			pymChild = new pym.Child();
			if (pymChild) { pymChild.sendHeight(); }


		}	/// end else ...


		return;


	}// end function onLoad();
	
	
	
	
	
	var height = 550; // height of graphic container. Updated on resizing.
	var chart_width; // width of graphic container. Updated on resizing.
	
	var	margin = { 
					top: 75,
					right: 50,
					bottom: 0,
					left: 50
				};
				
				
		
	var TotalxMax = -1;	
	
	var TotalxMaxArray = [ [], [] ];
	var subTotalxMaxArray = [];	
				

	/*
		name: 			drawGraphic
		DESCRIPTION:	Main drawing function to draw to DOM initial scarter plot view. 	
		CALLED FROM:	Pym in 	
		CALLS:			
		REQUIRES: 		n/a
		RETURNS: 		n/a
	*/
	function drawGraphic()
	{
			
			
		// clear out existing graphics and footer
		graphic0.empty();
		graphic1.empty();
		graphic2.empty();
		graphic3.empty();
		footer.empty();
		hyper0.empty();
		hyper1.empty();
		hyper2.empty();
		hyper3.empty();
		
		chart_width = graphic.width() - margin.left - margin.right;
		
		svgWidth = graphic1.width();
		svgHeight = height;
		dots = {};
		values = []; // define array to contain values for dots.
		
		var xDomain;
		
		
		vis.config.vars.panels.forEach(function(d,i){

			graphCode  = vis.config.vars.panels[i];
			graphIndex = i;
			
			var graphic_data_sorted = vis.graphic_data_full[vis.config.vars.graphic_data_url[0]].sort(function(x, y){ return d3.ascending(+x[vis.config.vars.fields[graphIndex]], +y[vis.config.vars.fields[graphIndex]]); })
			var Xmax = Math.ceil(d3.max(graphic_data_sorted, function(d,i) { return +d[vis.config.vars.fields[graphIndex]]; })/ vis.config.vars.xRoundedAxisLimits[graphIndex]) * vis.config.vars.xRoundedAxisLimits[graphIndex];
	
			if ( Xmax > TotalxMax ) { TotalxMax = Xmax; }
			
			TotalxMaxArray[0].push(Xmax);
			TotalxMaxArray[1].push(TotalxMax);
			
		})// end forEach ...
		
				 		
		if ( document.getElementById("Normalized").checked == false ) {
			subTotalxMaxArray = TotalxMaxArray[0];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][0];
		}
		else { 
			subTotalxMaxArray = TotalxMaxArray[1];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][1];
		}
		
		vis.config.vars.panels.forEach(function(d,i){

			graphCode  = vis.config.vars.panels[i];
			graphIndex = i;

			//create svg for chart
			svg = d3.select('#' + d)
				.append('svg')
				.attr("class" , "svg")
				.attr("id" , "svg" + i)
				.attr("width", svgWidth  ) 
				.attr("height", svgHeight )
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + (margin.top) + ")")
				.attr("id" , "g" + i)
				.style("opacity" , 0.33);

			var clip = svg.append("svg:clipPath")
			    .attr("id", "clip");

			clip.append("svg:rect")
			    .attr("id", "clip")
			    .attr("width", svgWidth)
			    .attr("height", svgHeight - margin.top )
			    .attr("fill", "red");

			d3.select("#svg"+i)
				.append("text")
				.attr( "class" , "titles")
				.attr( "id" , function(d,i){ return "title" + i; })
				.attr("x" , 0)
				.attr("y" , 20)
				.style("fill"  , "#888888")
				.text(vis.config.vars.scatterTitles[i]);

			d3.select("#svg"+i)
				.append("text")
				.attr( "class" , "subtitles")
				.attr( "id" , function(d,i){ return "subtitle" + i; })
				.attr("x" , 0)
				.attr("y" , 40)
				.style("fill"  , "#888888")
				.text(vis.config.vars.scatterSubTitles[i]);

			d3.select("#svg" + i)
				.append("text")
				.attr( "class" , "xAxisLabels")
				.attr( "id" , function(d,i){ return "xAxisLabel" + i; })
				.attr("x" , svgWidth - margin.left)
				.attr("y" , svgHeight - margin.top + 45)
				.text(vis.config.vars.xAxisLabels[i]);

//				for each dot in 'dots' array
//				vis.graphic_data_full[vis.config.vars.graphic_data_url[0]].forEach(function(d,i){
//
//					// set global variables for x and y axis value
//					var x = +d[vis.config.vars.fields[graphIndex]];
//					
//					// push x and y values on to vis. global arrays for use later
//					vis.xData.push(+d[vis.config.vars.fields[graphIndex]]);
//					
//				});	// end forEach	
				
				var formatPercent = d3.format(".0%f");
				var graphic_data_sorted = /*graphic_data*/vis.graphic_data_full[vis.config.vars.graphic_data_url[0]].sort(function(x, y){ return d3.ascending(+x[vis.config.vars.fields[graphIndex]], +y[vis.config.vars.fields[graphIndex]]); })

				vis.y = d3.scale.ordinal().rangeRoundBands([ (svgHeight-margin.top) , margin.top ], .1, 0);
				vis.y.domain(graphic_data_sorted.map(function(d,i) { return /*d.name*/d.code; }));
				vis.yAxis = d3.svg.axis().scale(vis.y).orient("left");
								
				/*var xDomain*/ xDomain = [ 0 , /*Xmax*/ (Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit) ];
				var xRange = [ 10, ( svgWidth - margin.right ) ];
				vis.x = d3.scale.linear().domain(xDomain).range(xRange);
				vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",.0f"));
		
				d3.select("#svg" + graphIndex)
					.append("g")
					.attr("class", "x axis")
					.attr("id", "focusXAxis"+i)
					.attr("transform", "translate(0," + ( svgHeight-margin.top ) + ")")
					.call(vis.xAxis);
										
				// draw tick grid lines extending from y-axis ticks on axis across scatter graph
				var xticks = d3.select("#svg"+graphIndex).selectAll('#focusXAxis'+i).selectAll('.tick');					 
				xticks.append('svg:line')
					.attr( 'class' , "xAxisTicks" )
					.attr( 'id' , "xAxisTicks" + graphIndex )
					.attr( 'y0' , 0 )
					.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
					.attr( 'x1' , 0 )
					.attr( 'x2',  0 )
					.style("display" , "inline")
					.style("opacity" , 0.33);					
				
/*	
				groups = d3.select("#svg" + graphIndex).selectAll('.group').data(graphic_data_sorted);
				groups = d3.select("#svg" + graphIndex).selectAll(".group")
					.data(graphic_data_sorted)
					.enter()
					.append("g")
						.attr("class" , function(d,i){ return "barGroup " + d.code + " " + graphCode; })

				d3.selectAll(".group").attr("transform" , function(d , i) { return "translate(" + vis.x(0) + ", " + vis.y(d.code) + ")"; });
*/
				
				/*groups*/
				d3.select("#svg" + graphIndex)
					.selectAll('.bars')
					.data(graphic_data_sorted)
					.enter()
					.append("rect")		
					.attr("class", function(d,i){ return "bars " + d.code + " " + graphCode; })
					.attr("x", function(d) { return vis.x(0); })
					.attr("y", function(d) { return vis.y(d.code); })
					.attr("width", function(d,i){ return vis.x( d[vis.config.vars.fields[graphIndex]] ) - vis.x(0); })
					.attr("height", function(d) { return vis.y.rangeBand() })
					.style("fill", function(d,i){ return vis.config.vars.singleColour[graphIndex]; }); 

				//append left hand transparent bars for interaction interactive 
				/*groups*/
				d3.select("#svg" + graphIndex)
					.selectAll('.barMasks')
					.data(graphic_data_sorted)
					.enter()
					.append("rect")	
					.attr("class" , function(d,i){ return "barMasks " + d.code + " " + graphCode; })
					.attr("value", graphCode )
					.attr("x", function(d) { return vis.x(0); })
					.attr("y", function(d) { return vis.y(d.code); })
					.attr("width", function(d,i){ return vis.x.range()[1] - vis.x.range()[0]; })
					.attr("height", function(d) { return vis.y.rangeBand()+2 })
					.on("mouseover", function(d,i){	
					
						d3.selectAll(".barMasks").style("opacity", 0.00).style("fill-opacity", 0.00);
					
						var gc = d3.select(this).attr("value");
						selectMapLAD(d.code, gc);

						$('#selectLADGroup').val("Select a Local Authority");	
						$('#selectLADGroup').trigger("chosen:updated");
													
						d3.selectAll(".barMasks." + d.code).style("opacity", 0.50).style("fill-opacity", 0.50);
						d3.selectAll(".bars").style("opacity" , 0.25);
						d3.selectAll(".bars."+d.code).style("opacity" , 1.00);
						d3.select(".infoParas." + d3.select(this).attr("value")).style("font-weight" , /*"bold"*/"normal"); 	
						d3.selectAll(".backgroundParas").style("display" , "backgroundParas");
						d3.select("#title").text("Foreign companies owning land or property in London");
						return;
					})
					.on("mouseout", function(d,i){
						
						deselectMapLAD(d.code);

						d3.select("#GreaterLondonLADs").selectAll("path").style("opacity" , 1.00).style("fill" , "#a8a8a8" /*, "white"*/);
						d3.select("#GreaterLondonLADs").style("opacity" , 1.00).style("fill" , "#a8a8a8" /*, "white"*/);
						d3.selectAll(".bars").style("opacity" , 1.00);
						d3.selectAll(".barMasks." + d.code).style("opacity", 0.00).style("fill-opacity", 0.00);
						d3.select(".infoParas." + graphCode).style( "font-weight" , "normal"); 
						d3.selectAll(".backgroundParas").style("display" , "block");
						d3.select("#title").text("Background Overview");
						
						return;
					});
					

				d3.select("#svg" + graphIndex)
					.selectAll('.tickLabels2')
					.data(graphic_data_sorted)
					.enter()
					.append("text")
					.attr("class" , function(d,i){ return "tickLabels2 " + d.code + " " + graphCode; })
					.attr("value", graphCode )
					.attr("x", function(d) { return vis.x(0) + 15; })
					.attr("y", function(d) { return vis.y(d.code) + 8; })
					.style("fill", "#FFFFFF")
					.style("font-size" , "9px")
					.style("font-weight" , "bold")
					.style("pointer-events" , "none")
					.style("display" , "inline")
					.text(function(d,i){ return /*"tickLabels2: " + */d.name/* + " : " + d.code*//* + "\t(" + d['graphic'+graphIndex] + ")"*/; }); 
					
					
					

				d3.select("#svg" + graphIndex)
					.append("g")
					.attr("class", "y axis")
					.attr("id", "yBottomAxis" + graphIndex)
					.attr("transform", "translate(" + 30 + "," + 0 + ")")
					.call(vis.yAxis);
				
				d3.select("#svg" + i)
					.append("text")
					.attr( "class" , "yAxisLabels")
					.attr( "id" , function(d,i){ return "yAxisLabel" + i; })
					.attr("x" , 0)
					.attr("y" , margin.top*0.85)
					.text(vis.config.vars.yAxisLabel);
					
					
		
				d3.selectAll(".y.axis")
					.selectAll("g")
					.selectAll("text")/*
					.style("text-anchor" , "start")
					.style("pointer-events" , "none")
					.attr("class" , function(d,i){ return "tickLabels " + d; })
					.text(function(d,i){ return LADS[LADCodes.indexOf(d)]; })*/
					.style("display" , "none");

					
			 d3.selectAll(".y.axis").selectAll("g").selectAll("line").style("fill", "#666").style("opacity", 0.15).style("display" , "none");

		})

		/* footers */
		d3.select("#graphicfooter0").append("text").text("Sources: ");
		d3.select("#graphicfooter1").text("Companies: ");
		
		vis.config.vars.datasources.forEach(function(d,i){
			d3.select("#graphicfooter0")
				.append("a")
				.attr("class" , "citation")
				.attr("id" , "citation0")
				.attr("href", vis.config.vars.datasources_destinations[i])
				.attr("target" , "_blank")
				.html(vis.config.vars.datasources[i]).append("text").text(" ");
		})
		
		vis.config.vars.companies.forEach(function(d,i){
			d3.select("#graphicfooter1")
				.append("a")
				.attr("class" , "citation")
				.attr("id" , "citation1")
				.attr("href", vis.config.vars.company_destinations[i])
				.attr("target" , "_blank")
				.html(vis.config.vars.companies[i]).append("text").text(" ");
		})
		
		vis.config.vars.companies.forEach(function(d,i){
			d3.select("#graphicfooter2")
				.append("a")
				.attr("class" , "citation")
				.attr("id" , "citation2")
				.attr("href", vis.config.vars.datasources_destinations2[i])
				.attr("target" , "_blank")
				.html(vis.config.vars.datasources2[i]).append("text").text(" ");
		})
		
		d3.select("#graphicfooter3")
			.append("a")
				.attr("href", "http://innovation.thomsonreuters.com/en/labs.html")
				.attr("target" , "_blank")
				.html("Data visualisation by Thomson Reuters Labs");
				
				
		//use pym to calculate chart dimensions	
		if (pymChild) { pymChild.sendHeight(); }
				

		return;
		 

	} // end function ()




	/*
		NAME: 			buildUI
		DESCRIPTION: 	function to build intitial UI interface.
		CALLED FROM:	Modernizr.inlinesvg
		CALLS:			n/a
		REQUIRES: 		n/a	
		RETURNS: 		n/a		
	*/
	function buildUI(){	
	
	
	
			// Build y-axis variable selection list. initialise and populate with selection ist variable indexes
			var valueArray = [];
			for ( var i=0 ; i < LADS.length; i++ ) { valueArray[i] = i; }	


			// build and manipulate data arrays to help populate y-axis array...
			var LADSArray = d3.zip( LADS , valueArray );
			vis.LADSArray = LADSArray.sort(function(b, a){ return d3.descending(a[0], b[0])});
				
			// Build option menu for y-Axis
			var LADSOptns = d3.select("#selectionList") 
			/*var LADSOptns = d3.select("#selectionBox")*/
				.append("select")
				.attr("id","selectLADGroup")
				.attr("style","width:100%")
				.attr("class","chosen-select");
				
			// populate variable selection list.
			LADSOptns.selectAll("p")
				.data(vis.LADSArray)
				.enter()
				.append("option")
				.attr("value", function(d){ return d[1]}) 
				.text(function(d){ return d[0]});
				
											
			// define dimensions and functionality associated with selection list ... 
			$('#selectLADGroup').chosen({width: "75%", allow_single_deselect: true, placeholder_text_single:"Select a Local Authority"}).on('change',function(evt,params)
			{


				// if selection list variable is valid selection ...
				if(typeof params != 'undefined')
				{		
			
					d3.selectAll(".barMasks").style("opacity", 0.00).style("fill-opacity", 0.00);
												
					// update selectedIndex and name variables of newly selected option on selection list
					vis.selectedLADIndex = params.selected;
					vis.selectedLADVariable = LADCodes[vis.selectedLADIndex];	
					
					d3.select("#GreaterLondonLADs").selectAll("path").style("fill" , "#a8a8a8" /*, "white"*/);
					d3.select("#"+vis.selectedLADVariable.replace(/ /g, "")).style("fill" , "#005DA2");	
											
					d3.selectAll(".bars").style("opacity" , 0.25);
					d3.selectAll(".bars."+vis.selectedLADVariable.replace(/ /g, "")).style("opacity" , 1.00);
					
					selectMapLAD(vis.selectedLADVariable.replace(/ /g, ""),  '');
					
					d3.selectAll(".backgroundParas").style("display" , "none");
					
					return;	
						
				} // end if ....
				else {
				} // end else ....
				
				$('#selectLADGroup').val(vis.selectedLADIndex);	
				$('#selectLADGroup').trigger("chosen:updated");
											
			});	// end definition
	
		$('#selectLADGroup').val(vis.selectedLADIndex);	
		$('#selectLADGroup').trigger("chosen:updated");
		

		d3.select("#button")
			.append("div")
			.attr("class" , "btn-group rightgroup")
			.attr("id" , "rightgroup")
			.attr("role" , "group")
			.attr("aria-label" , "Basic example")
			.style("background" , "none");
			
			
			
			
		var slt = $("#groups");
		var offsetHeight = document.getElementById('groups').offsetHeight;
	
	/*	d3.select("#buffer")
		.append("button")
		.attr("type" , "buffer")
		.attr("class" , "btn btn-primary-outline default")
		.attr("id" , "transition")
		.style("background" , "#4D4D4D")
		.style("color" , "white")
		.style("opacity" , 0.50)
		.on("click", function(d,i){
			transitionData(this.id);

			if ( vis.selectedAxisLimitVariable == "Fixed" ){ vis.selectedAxisLimitVariable = "Data"; }
			else if ( vis.selectedAxisLimitVariable == "Data" ){ vis.selectedAxisLimitVariable = "Fixed"; }	
			vis.limitTypeIndex = vis.config.vars.axisLimits.indexOf(vis.selectedAxisLimitVariable);
		
			d3.select("#transition").text("Change to " + vis.selectedAxisLimitVariable + " axis limits");

			return;
		})
		.on("mouseover", function(d,i){
			d3.select("#" + this.id).style("opacity" , 1.00);
			return;
		})
		.on("mouseout", function(d,i){
			d3.select("#" + this.id).style("opacity" , 0.50);
			return;
		})
		.text("Change to " + vis.selectedAxisLimitVariable + " axis limits");*/
	  
	 /*
		d3.select('#mapInfo')
			.append("p")
			.attr("class" , "infoTextTitle")
			.text(vis.config.vars.backgroundTitle);*/
			
		
		var backgroundTitle = "Background Overview";
		
		var background = [
							"Data is becoming increasingly important in the fight against corruption and money laundering. Combining open data, (e.g. Land Registry, Thomson Reuters PermID and Open Corporates’ company database), shared data (e.g. Thomson Reuters World Check data), and closed data (like Mossack Fonseca’s leaked client database) - provides crucial insights to identifying connections and potentially suspicious transactions. ",
							"The current state of data available still does not extend to the majority of smaller, non-publicly traded companies. These are the ones that we have least information about and that can provide a platform behind which various entities are able to hide. Another vital challenge for our analysis was matching entities across the five datasets. Name alignment was done through string matching. Perm ID and OpenCorporates have their own, differing, built-in algorithms for this, while the Panama Papers and World Check dataset was string-matched with some text normalisation. Without the availability of consistent unique identifiers, analysis conducted through string-matching will inevitably introduce uncertainty. ",
							"Based on name and country of jurisdiction, only about 13,000 out of the 24,000 overseas companies owning property or land in London have a corresponding record in the datasets used. Hence, we have no indication whether the other 46% of companies which are unknown are involved in suspicious activity or simply lack information. By driving for greater transparency we will be able to deliver a more complete picture. "
						];
								 
		d3.select("#mapInfo")
			.append("p")
		 	.attr("id" , "title")
			.style("font-size" , "2.5em")
			.style("font-weight" , "bold")
			.style("color" , "white")
			.html(backgroundTitle);
				
				
/*		 d3.select('#mapInfo').append("label")
		 	.attr("id" , "title")
			.style("font-size" , "2.0em")
			.style("font-weight" , "bold")
			.style("color" , "#4d4d4d")
			.text(backgroundTitle);
		 */
		
		
		background.forEach(function(d,i){
			 
			d3.select('#mapInfo')
				.append("p")
				.attr("class" , "backgroundParas")
				.attr("id" , "background" + i)
				.style("font-size" , "1.25em")
				.style("font-weight" , "normal")
				.style("color" , "white")
				.text(d) 
		 });
		
		return;
			
	} // end function buildUI()


	
	function selectMapLAD(fid , gc){
		
		var LAdInfo = '';
		$(".infoParas").remove();
		$(".infoTextBackground").hide();
		$(".infoText").hide(); 
		
		/*graphic_data*/vis.graphic_data_full[vis.config.vars.graphic_data_url[vis.selectedFileIndex]].forEach(function(d,i){
			if ( d.code == fid ) { LAdInfo = d; }
		})
		
		d3.selectAll(".barMasks").style("opacity", 0.00).style("fill-opacity", 0.00);
		d3.selectAll(".infoTextTitle").text(LAdInfo.name/* + " (" + LAdInfo.code + ")"*/ );
		
		vis.config.vars.fields.forEach(function(d,i){
			
			var g = vis.config.vars.panels[i];
			
		 	d3.select('#mapInfo')
				.append("p")
				.attr("class" , function(d,i){ return "infoParas " + g; })
				.attr("id" , "infoPara"+i)
				.style("font-size" , "1.25em")
				.style("font-weight" , "normal")
				.style("stroke-style" , "solid")
				.style("color" , "white")
				.text( vis.config.vars.scatterTitles[i] + " " + vis.config.vars.scatterSubTitles[i] + " = " + numberWithCommas(parseFloat(LAdInfo[vis.config.vars.fields[i]]).toFixed(0)) + " - " + vis.config.vars.addinfo[i]);
						
		})// end forEach ... 
		
		d3.select("#GreaterLondonLADs").selectAll("path").style("fill" , "#a8a8a8" /*, "white"*/);
		
		if ( gc == '' ) { d3.select("#"+fid.replace(/ /g, "")).style("fill" , "#005DA2"); }
		else { d3.select("#"+fid.replace(/ /g, "")).style("fill" , vis.config.vars.singleColour[vis.config.vars.panels.indexOf(gc)] ); }	
					
		d3.selectAll(".bars").style("opacity" , 0.25);
		d3.selectAll(".bars."+fid.replace(/ /g, "")).style("opacity" , 1.00);
		
		d3.selectAll(".barMasks." + fid).style("opacity", 0.50).style("fill-opacity", 0.50);
		
//		d3.selectAll(".y.axis").selectAll(".tickLabels").select("text").style("display" , "none");
//		d3.selectAll(".tickLabels." + LAdInfo.name.replace(/ /g, "")).select("text").style("display" , "inline");

		d3/*.selectAll(".y.axis")*/.selectAll(".tickLabels2")/*.selectAll("text")*/.style("display" , "none");
		d3.selectAll/*(".y.axis").selectAll('.tick').selectAll*/(".tickLabels2." + LAdInfo.code)/*.selectAll("text")*/.style("display" , "inline");
		
		d3.selectAll(".backgroundParas").style("display" , "none");
		d3.select("#title").text("Overseas companies owning land or property in London");
												
		return;
		
	}// end function selectMapLAD(fid)
	
	
	
	
	function deselectMapLAD(fid){
		
		$(".infoParas").remove(); 
		$(".infoTextTitle").show();
		$(".infoTextBackground").show();
		d3.selectAll(".infoTextBackground").style("margin-top" , "10px"); 
		d3.selectAll(".infoTextTitle").style("display" , "inline").text(vis.config.vars.backgroundTitle);	
		d3.select(".infoText").style("display" , "inline").text(vis.config.vars.background);
		d3.select("#GreaterLondonLADs").selectAll("path").style("fill" , "#a8a8a8" /*, "white"*/);
		d3.selectAll(".bars").style("opacity" , 1.00);
		d3.selectAll(".barMasks." + fid).style("opacity", 0.00).style("fill-opacity", 0.00);
		d3.selectAll/*(".y.axis").selectAll*/(".tickLabels2")/*.select("text")*/.style("display" , "inline");
		d3.selectAll(".backgroundParas").style("display" , "block");
		d3.select("#title").text("Background Overview");

		return;
		
	}// end function deselectMapLAD(fid)
	
	
	
	
	
	function numberWithCommas(x) {
    	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	
	function isOdd(num) { return num % 2; }
				
		
		
		


	/*
		NAME: 			transitionData
		DESCRIPTION: 	function used to transition all and/or selected grouped dots plus related voronoi layers
		CALLED FROM:	clickPillGroups
						drawGraphic
		CALLS:			showtooltip
						hidetooltip
		REQUIRES: 		n/a
		RETURNS: 		n/a
	*/
	function transitionData()
	{

		var graphic_data	 = vis.graphic_data_full[vis.selectedFile];
		TotalxMax = -1;
		Xmax = -1;
		

		TotalxMaxArray = [ [], [] ];
		subTotalxMaxArray = [];
		
		vis.config.vars.panels.forEach(function(d,i){

			graphCode  = vis.config.vars.panels[i];
			graphIndex = i;
			
			var graphic_data_sorted = graphic_data.sort(function(x, y){ return d3.ascending(+x[vis.config.vars.fields[graphIndex]], +y[vis.config.vars.fields[graphIndex]]); })
			var Xmax = Math.ceil(d3.max(graphic_data_sorted, function(d,i) { return +d[vis.config.vars.fields[graphIndex]]; })/ vis.config.vars.xRoundedAxisLimits[graphIndex]) * vis.config.vars.xRoundedAxisLimits[graphIndex];
	
			if ( Xmax > TotalxMax ) { TotalxMax = Xmax; }
			
			TotalxMaxArray[0].push(Xmax);
			TotalxMaxArray[1].push(TotalxMax);
			
		})// end forEach ...
		
				 		
		if ( document.getElementById("Normalized").checked == false ) {
			subTotalxMaxArray = TotalxMaxArray[0];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][0];
		}
		else { 
			subTotalxMaxArray = TotalxMaxArray[1];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][1];
		}
		
		for (var field in graphic_data[0]) {
		
			if ( field == "index" || field == "date" ) { continue; }
  	
			myData[field] = graphic_data.map(function(d,i) {
							
				return {
						'code': d["code"],
						'name': d["name"],
						'graphic0': +d["graphic0"],
						'graphic1': +d["graphic1"],
						'graphic2': +d["graphic2"],
						'graphic3': +d["graphic3"]
				};
			}); 
				
		}// end for ...
		
		var panel = 0;
		
		vis.config.vars.panels.forEach(function(d,i){
			
			panel = i;
			graphCode  = d;
			graphIndex = panel;
						
			graphic_data_sorted = myData[graphCode].sort(function(x, y){ return d3.ascending(+x[vis.config.vars.fields[graphIndex]], +y[vis.config.vars.fields[graphIndex]]); })
			Xmax = Math.ceil(d3.max(graphic_data_sorted, function(d,i) { return +d[vis.config.vars.fields[graphIndex]]; })/ vis.config.vars.xRoundedAxisLimits[graphIndex]) * vis.config.vars.xRoundedAxisLimits[graphIndex];
			//var graphic_data_sorted = myData[graphCode].sort(function(x, y){ return d3.ascending(+x[vis.config.vars.fields[graphIndex]], +y[vis.config.vars.fields[graphIndex]]); })
	
			vis.x.domain([0,Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit]);
			vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",." + vis.config.vars.xaxislabelPrecison + "f"));	
			
	
			d3.select("#svg" + graphIndex).select(".x.axis").transition()/*.duration(3000)*/.call(vis.xAxis);
	
			// redraw tick grid lines extending from x-axis ticks on axis across scatter graph
		/*	var xticks = d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).selectAll('.tick');					 
			xticks.append('svg:line')
				.attr( 'id' , "xAxisTicks"+ graphIndex)
				.attr( 'y0' , 0 )
				.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
				.attr( 'x1' , 0 )
				.attr( 'x2',  0 )
				.style("fill" , "#A00000")
				.style("display" , "inline")
				.style("opacity" , 0.33);*/

				
			var y0 = vis.y.domain(graphic_data_sorted.sort(
				function(a, b) { return +a["graph"+graphIndex] - +b["graph"+graphIndex]; })
				.map(function(d) { return d.code; }))
				.copy();
	
			var transition = d3.select("#svg" + graphIndex).transition().duration(1000), delay = function(d, i) { return i * 50; };
			
			d3.select("#svg" + graphIndex).selectAll(".bars").sort(function(a, b) { return y0(a.code) - y0(b.code); });
			transition.selectAll(".bars").delay(delay).attr("y", function(d) { return y0(d.code); });
			
			d3.select("#svg" + graphIndex).selectAll(".barMasks").sort(function(a, b) { return y0(a.code) - y0(b.code); });
			transition.selectAll(".barMasks").delay(delay).attr("y", function(d) { return y0(d.code); });
			
			d3.select("#svg" + graphIndex).selectAll(".tickLabels2").sort(function(a, b) { return y0(a.code) - y0(b.code); });
			transition.selectAll(".tickLabels2").delay(delay).attr("y", function(d) { return y0(d.code) + 8; }); 
						
			transition.select(".y.axis")
								.call(vis.yAxis)
								.selectAll("g")
								.delay(delay);
				
				
			if ( panel < 4 ) {
				
				if ( vis.selectedFileIndex == 0 ) {
					
					console.log("vis.selectedFileIndex == 0");
					//d3.select("#"+graphCode).attr("class" , "col-xs-6 col-sm-3 col-md-3 graphic");
					
					var newWidth = $("#graphic" + graphIndex).width();
					d3.select("#svg"+graphIndex).attr("width" , newWidth);
					var xRange = [ 10, ( newWidth - margin.right ) ];
					
					xDomain = [ 0 , (Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit) ];
						
					vis.x = d3.scale.linear().domain(xDomain).range(xRange);
					vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",.0f"));
					
					d3.select("#svg" + graphIndex).select(".x.axis").transition().duration(3000).call(vis.xAxis);
										
					// redraw tick grid lines extending from x-axis ticks on axis across scatter graph
			/*		var xticks = d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).transition().duration(3000).selectAll('.tick');	
									 
					xticks.append('svg:line')
						.attr( 'id' , "xAxisTicks"+ graphIndex)
						.attr( 'y0' , 0 )
						.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
						.attr( 'x1' , 0 )
						.attr( 'x2',  0 )
						.style("fill" , "red")
						.style("display" , "inline")
						.style("opacity" , 0.33);*/
															
					d3.select("#svg" + graphIndex)
						.selectAll(".barMasks")
						.attr("width", vis.x.range()[1] - vis.x.range()[0]);
		
					d3.select("#svg" + graphIndex)
						.selectAll(".bars") 
						.data(graphic_data_sorted) 
						.transition()
						.duration(750)
						.delay(function(d, i) { return i * 50; })
						.attr("class", function(d,i){ return "bars " + d.code + " " + graphCode; })
						.attr("width", function(d,i){ return vis.x( d[vis.config.vars.fields[graphIndex]] ) - vis.x(0); })
						.attr("y", function(d) {return y0(d.code);})
						
					d3.selectAll(".xAxisLabels")
						.transition()
						.duration(3000)
						.attr("x" , newWidth - margin.left);
				}
				else {
					console.log("else");
					//d3.select("#"+graphCode).attr("class" , "col-xs-6 col-sm-4 col-md-4 graphic");
					
					var newWidth = $("#graphic" + graphIndex).width();
					d3.select("#svg"+graphIndex).attr("width" , newWidth);
					var xRange = [ 10, ( newWidth - margin.right ) ];
					
					xDomain = [ 0 , (Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit) ];
						
					vis.x = d3.scale.linear().domain(xDomain).range(xRange);
					vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",.0f"));
					d3.select("#svg" + graphIndex).select(".x.axis").transition().duration(3000).call(vis.xAxis);
					
			
					// redraw tick grid lines extending from x-axis ticks on axis across scatter graph
				/*	var xticks = d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).selectAll('.tick');					 
					xticks.append('svg:line')
						.attr( 'id' , "xAxisTicks"+ graphIndex)
						.attr( 'y0' , 0 )
						.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
						.attr( 'x1' , 0 )
						.attr( 'x2',  0 )
						.style("display" , "inline")
						.style("opacity" , 0.33);*/
						
															
					d3.select("#svg" + graphIndex)
						.selectAll(".barMasks")
						.attr("width", vis.x.range()[1] - vis.x.range()[0]);
		
					d3.select("#svg" + graphIndex)
						.selectAll(".bars") 
						.data(graphic_data_sorted) 
						.transition()
						.duration(750)
						.delay(function(d, i) { return i * 50; })
						.attr("class", function(d,i){ return "bars " + d.code + " " + graphCode; })
						.attr("width", function(d,i){ return vis.x( d[vis.config.vars.fields[graphIndex]] ) - vis.x(0); })
						.attr("y", function(d) {return y0(d.code);})
						
					d3.selectAll(".xAxisLabels")
						.transition()
						.duration(3000)
						.attr("x" , newWidth - margin.left);
				}
			}
			else {
				if ( vis.selectedFileIndex == 0 ) {
					
					$("#"+graphCode).removeClass("hide");
					
					var newWidth = $("#graphic" + graphIndex).width();
					d3.select("#svg"+graphIndex).attr("width" , newWidth);
					var xRange = [ 10, ( newWidth - margin.right ) ];
					
					xDomain = [ 0 , (Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit) ];
						
					vis.x = d3.scale.linear().domain(xDomain).range(xRange);
					vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",.0f"));
					
					
					d3.select("#svg" + graphIndex).select(".x.axis").transition().duration(3000).call(vis.xAxis);
										
					// redraw tick grid lines extending from x-axis ticks on axis across scatter graph
/*					var xticks = d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).selectAll('.tick');					 
					xticks.append('svg:line')
						.attr( 'id' , "xAxisTicks"+ graphIndex)
						.attr( 'y0' , 0 )
						.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
						.attr( 'x1' , 0 )
						.attr( 'x2',  0 )
						.style("fill" , "green")
						.style("display" , "inline")
						.style("opacity" , 0.33);
*/
															
					d3.select("#svg" + graphIndex)
						.selectAll(".barMasks")
						.attr("width", vis.x.range()[1] - vis.x.range()[0]);
		
					d3.select("#svg" + graphIndex)
						.selectAll(".bars") 
						.data(graphic_data_sorted) 
						.transition()
						.duration(750)
						.delay(function(d, i) { return i * 50; })
						.attr("class", function(d,i){ return "bars " + d.code + " " + graphCode; })
						.attr("width", function(d,i){ return vis.x( d[vis.config.vars.fields[graphIndex]] ) - vis.x(0); })
						.attr("y", function(d) {return y0(d.code);})
						
					d3.selectAll(".xAxisLabels")
						.transition()
						.duration(3000)
						.attr("x" , newWidth - margin.left);
				}
				else {
					//$("#"+graphCode).addClass("hide");
				}
				
			} // end else ...
					
		})	

		return;
		 
	 }// end transitionData()
	 
	 
	 
	 
	 function getDataType(fid){
		 
		vis.selectedFile = fid.id;
		vis.selectedFileIndex = vis.config.vars.graphic_data_url.indexOf(vis.selectedFile);
		transitionData();
		 
		return;
		 
	 }// end function getDataType()
	 
	 
	  
	 function Normalized(fid){
		 
		var xRoundedAxisLimit = 0;
		 		
		if ( document.getElementById("Normalized").checked == false ) {
			subTotalxMaxArray = TotalxMaxArray[0];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][0];
		}
		else { 
			subTotalxMaxArray = TotalxMaxArray[1];
			xRoundedAxisLimit = xRoundedAxisLimits[vis.selectedFileIndex][1];
		}
			 
		vis.config.vars.panels.forEach(function(d,i){
					
			panel = i;
			graphCode  = d;
			graphIndex = panel;
			d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).selectAll('.tick').remove();
			
			vis.x.domain([0,Math.ceil(subTotalxMaxArray[graphIndex]/xRoundedAxisLimit)*xRoundedAxisLimit]);
			vis.xAxis = d3.svg.axis().scale(vis.x).orient("bottom").ticks(num_ticksx).tickFormat(d3.format(",." + vis.config.vars.xaxislabelPrecison + "f"));	
			
			d3.select("#svg" + graphIndex).select(".x.axis").transition().duration(3000).call(vis.xAxis);		
			
			d3.select("#svg" + graphIndex).selectAll(".bars." + graphCode)
				.transition()
				.duration(3000)
				.attr("width", function(d,i){ return vis.x( d[vis.config.vars.fields[graphIndex]] ) - vis.x(0); }); 
					
			// redraw tick grid lines extending from x-axis ticks on axis across scatter graph
			var xticks = d3.select("#svg" + graphIndex).select('#focusXAxis' + graphIndex).selectAll('.tick');					 
			xticks.append('svg:line')
				.attr( 'id' , "xAxisTicks"+ graphIndex)
				.attr( 'y0' , 0 )
				.attr( 'y1' , -((svgHeight-margin.top) - margin.top) )
				.attr( 'x1' , 0 )
				.attr( 'x2',  0 )
				.style("display" , "inline")
				.style("opacity" , 0.33);
		})
				 
		return;
		 
	 }// end function Normalized(fid) 
	 
	 