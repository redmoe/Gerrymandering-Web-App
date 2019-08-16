var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
// ctx.imageSmoothingEnabled = false;
var grid=[];
var voters=[];

var gridWidth=16;
var gridHeight=16;
var gridSize=30;

var chanceToPickNonEmpty=.9

var voterImg = document.getElementById("voter");
var repImg = document.getElementById("repImg");
var demImg = document.getElementById("demImg");

c.height=gridHeight*gridSize;
c.width=gridWidth*gridSize;

var districtColors;

var repColor="#FF0000";
var demColor="#0000FF";
var numberOfVoters=100;
var slide = document.getElementById('numVotersSlide')
slide.oninput = function() {
    document.getElementById("numVotersAmount").innerHTML = this.value;
}
slide.onchange = function() {
    numberOfVoters=this.value;
    calculateValues()
}

var democratPercentage=.5;
var slide = document.getElementById('demPercSlide')
slide.oninput = function() {
    document.getElementById("demPercAmount").innerHTML = this.value;
}
slide.onchange = function() {
    democratPercentage=this.value/100;
    calculateValues()
}

var cityCount=1;
var slide = document.getElementById('numCitiesSlide')
slide.oninput = function() {
    document.getElementById("numCitiesAmount").innerHTML = this.value;
}
slide.onchange = function() {
    cityCount=this.value;
    calculateValues()
}

var democratUrban=.5;
var republicanUrban=.1;


var districtCount=7;
var slide = document.getElementById('numDistrictsSlide')
var generationTotal=0;
slide.oninput = function() {
    document.getElementById("numDistrictsAmount").innerHTML = this.value;
}
slide.onchange = function() {
    districtCount=this.value;
    logChart.data.labels=[]
    logChart.data.datasets[0].data=[]
    logChart.data.datasets[1].data=[]
    for (i=0;i<=districtCount;i++) {
    	logChart.data.labels.push(String(i))
    	logChart.data.datasets[0].data.push(0)
    	logChart.data.datasets[1].data.push(0)
    }
    logChart.update()
    calculateValues()
}

var mapCount=1
$("#mapGenSlider").on('input', function() {
	mapCount=$("#mapGenSlider").val()	
    $("#mapGenAmount").html(this.value);
});

// $("#mapGenSlider").on('change', function() {
//     mapCount=this.value;
// })

$("#ColorModeSelect").on('input', function() {
	Current_ColorMode=ColorModes[this.value]
	$("#ColorModeDesc").html(ColorDesc[this.value])
})

$("#BrushSelect").on('input', function() {
	Current_BrushMode=BrushModes[this.value]
})

var displayVoters=true
$("#VoterToggle").click(function(){
	displayVoters=!displayVoters
})

var districts=[]

var dirX=[1,-1,0,0];
var dirY=[0,0,1,-1];

var startTime, endTime;

var flagZones=[]

var totalRepublicans=numberOfVoters*(1-democratPercentage);
var totalDemocrats=numberOfVoters*democratPercentage;
var requiredVoters=districtCount/numberOfVoters;

function calculateValues() {
	//1 republican even if set at 100% democrat
	totalRepublicans=Math.floor(numberOfVoters*(1-democratPercentage));
	totalDemocrats=Math.floor(numberOfVoters*democratPercentage);
	requiredVoters=districtCount/numberOfVoters;
	chart.data.datasets[0].data=[]
	chart.data.datasets[1].data=[]
	chart.update()
	mapCount=$("#mapGenSlider").val()	
	mapGenFunction()
}
function CreateCityVoters(number,party,deviation,startX,startY) {
	for (var i=0; i<number; i++) {
		var y=expoDistribution(deviation)*(Math.random()<.5 ? -1 : 1)+startX
		var x=expoDistribution(deviation)*(Math.random()<.5 ? -1 : 1)+startY
		CreateVoter(party,mid(0,x,gridWidth-1),mid(0,y,gridHeight-1))
	}
}

function mid(low,cur,high) {
	return Math.max(Math.min(high,cur),low)
}
// function paretoDistribution (minimum, alpha) {
//     var u = 1.0 - Math.random();
//     return Math.min(minimum / Math.pow(u, 1.0 / alpha),7);
// }

function expoDistribution (lambda) {
    return -Math.log(1.0 - Math.random()) / lambda;
}

function CreateUniformVoters (number,party) {
	for (var i=0;i<number+1;i++) {
		var x=Math.random()*gridWidth;
		var y=Math.random()*gridHeight;
		CreateVoter(party,x,y)
	}
}

function CreateVoter (party,x,y) {
	var tile=grid[Math.floor(x)][Math.floor(y)]
	voters.push({x:x,y:y,party:party});
	tile.votes+=party;
	tile.voters+=1
}
function CreateDistrictPrimatives() {
	districts=[];	
	for (var i=0;i<=districtCount;i++) {
		districts.push({voters:0,tiles:[],poll:0,color:districtColors[i]})
	}
}


function RandomGridPosition() {
	return {x:Math.floor(Math.random()*gridWidth),y:Math.floor(Math.random()*gridHeight)}
}
var worm={x:0,y:0,dx:1,dy:0,c:0};


//runs the start of the program
window.onload=function setup() {
	InitChart()
	mapGenFunction=NewMap
	calculateValues()
    // mapGenFunction();
	update();	
}
var ResetDistricts=function() {
	startTime = new Date();
	gameOverRun=false;
	CreateDistrictPrimatives()
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			grid[x][y].district=0;
			districts[0].tiles.push(grid[x][y]);
		}
	}	
	for (var d=1; d<=districtCount;d++) {
		SeedDistrict(d);
	}	
}

var BlankMap=function() {
    var scheme = new ColorScheme;
    scheme.from_hue(Math.random()*255).scheme('triade').variation('pastel')
    districtColors=scheme.colors()
	voters=[];
	gameOverRun=false;
	CreateDistrictPrimatives()
	InitializeGrid()
	startTime = new Date();
}

var NewMap=function () {
	// Current_ColorMode=ColorModes["Districts"]
	// $("#ColorModeSelect").innerHTML="Districts"
	BlankMap()
	// for x=0; x<cityCount; x++ do
	var cityX=(Math.random()*gridWidth/4-gridWidth/8)+gridWidth/2
	var cityY=(Math.random()*gridHeight/4-gridWidth/8)+gridHeight/2
	CreateCityVoters(totalDemocrats*democratUrban,-1,1,cityX,cityY)
	CreateCityVoters(totalRepublicans*republicanUrban,1,1,cityX,cityY)
	CreateUniformVoters(totalDemocrats*(1-democratUrban),-1);
	CreateUniformVoters(totalRepublicans*(1-republicanUrban),1);
	
	for (var d=1; d<=districtCount;d++) {
		SeedDistrict(d);
	}	
}
var mapGenFunction=NewMap
$(document).on("keypress", function (e) {
	// ResetDistricts();
	pause=!pause
});

$("#pause").click(function() {
	pause=!pause
	$("#pause").html(pause ? "Play" : "Pause")
})

$( "#ResetMap" ).click(function() {
	mapCount=$("#mapGenSlider").val()
	mapGenFunction=ResetDistricts;
	mapGenFunction()
});

$( "#BlankMap" ).click(function() {
	mapCount=$("#mapGenSlider").val()
	mapGenFunction=BlankMap
	mapGenFunction()
});

// $( "#NewMap" ).click(function() {
// 	NewMap();
// });

$( "#NewMaps" ).click(function() {
	mapCount=$("#mapGenSlider").val()
	mapGenFunction=NewMap
    mapGenFunction();

});
var drawGame=true
var gameOverRun=false;
//runs every frame
var pause=false
function update(timestamp){
	if (!pause) {
		if (districts[0].tiles.length!=0) {
			DiamondFill();
			ReleaseNonContiguous();
		}
		else if (!gameOverRun) {
			DrawWinners();
			gameOverRun=true;
			mapCount--;
			if (mapCount>0) {
				mapGenFunction()
			}
			EndStats()
		}
	}
	if (drawGame) {
		drawGame=false;
		setTimeout(draw,0)
	}
	requestAnimationFrame(update);	
}

//runs at a set time
function draw() {
	DrawDistricts(grid);
	drawDistrictBorders()
	drawGame=true;
	if (displayVoters) {
		DrawVoters(grid);
	}
	if (gameOverRun) {
		DrawWinnersUI()
	}	
}

function EndStats() {
	endTime = new Date();
	var timeDiff = endTime - startTime; //in ms
  	timeDiff /= 1000;
	var seconds = Math.round(timeDiff);
	console.log(seconds + " seconds");	
}

function DrawDistricts(frame) {
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			let tile=frame[x][y]
			let tileDistrict=tile.district;
			ctx.fillStyle=Current_ColorMode(tile)
	        ctx.fillRect(x*gridSize,y*gridSize,50,50);
            ctx.fillStyle="white"
		}
	}
}

function DrawVoters(frame) {
	ctx.font = (gridSize/1.25)+"px Arial";
	voters.forEach(function(v) {
		var icon="?"
		if (v.party>0) {
			icon="R"
			ctx.fillStyle = repColor;
			ctx.drawImage(repImg,v.x*gridSize,v.y*gridSize,gridSize,gridSize)
		}
		else {
			icon="D"
			ctx.fillStyle = demColor;
			ctx.drawImage(demImg,v.x*gridSize,v.y*gridSize,gridSize,gridSize)
		}
		// ctx.fillText(icon, v.x*gridSize, v.y*gridSize+(gridSize/1.25));
	});
}

function GetDistrictCenter(district) {
	let x=0;
	let y=0;
	for (var i=0; i<district.tiles.length;i++) {
		x+=district.tiles[i].x;
		y+=district.tiles[i].y;
	}
	x/=district.tiles.length;
	y/=district.tiles.length;
	return {x:x,y:y}
}


function DrawWinners() {
	var republicanWins=0;
	var democratWins=0;
	for (var i=1; i<=districtCount;i++) {
		if (districts[i].poll==0) {
			districts[i].poll+=Math.random()>.5 ? 1 : -1
			console.log("tossed a coin for district "+i)
		}
		if (districts[i].poll>0) {
			republicanWins++;
		}
		else {
			democratWins++;
		}
	}
	var winCat=Math.abs(republicanWins-democratWins)
	// chart.data.datasets[0].data[republicanWins]-=1
	// chart.data.datasets[1].data[democratWins]+=1
	chart.data.datasets[0].data.push(democratWins)
	chart.data.datasets[1].data.push(republicanWins)	
	// addData(chart, "a", republicanWins)	
	generationTotal++;
	chart.data.labels.push(generationTotal)
	// chart.data.datasets[1].label.push("B")
	logChart.data.datasets[0].data[democratWins]+=1
	logChart.data.datasets[1].data[republicanWins]+=1
	logChart.update()
	chart.update()
	var txt = document.getElementById("win");
	txt.innerHTML="R "+republicanWins+" to D "+democratWins+". "+(democratWins>republicanWins ? "Democrats" : "Republicans")+" win!"		
}

function DrawWinnersUI() {
	ctx.font = (gridSize/2)+"px Arial";
	ctx.fillStyle="#ffffff"	
	for (var i=1;i<=districtCount;i++) {
	    let pos = GetDistrictCenter(districts[i])
	    let stats=["DISTRICT "+i,"\nVoters "+districts[i].voters,"\nPoll "+districts[i].poll]
		for (var f=0;f<stats.length;f++) {
			ctx.fillText(stats[f],pos.x*gridSize-ctx.measureText(stats[f]).width/2,pos.y*gridSize+f*(gridSize/2));
		}
	}
}

var ColorDesc={
	Competitiveness:"Displays how close the poll is between parties.",
	PredictedWinner:"Shows who will win the district with current votes.",
	PopulationDensity:"Shows how much space to voters a district has.",
	Districts:"Displays diffrent districts in pleasing colors.",
	Compactness:"Shows how spread out a district.",
	WastedVote:"Displays the perentage of the that was wasted."
}

var ColorModes={
	Competitiveness:function (tile) {
		tileDistrict=districts[tile.district]
		repVoters=(tileDistrict.voters+tileDistrict.poll)/2
		demVoters=tileDistrict.voters-repVoters
		c=repVoters/tileDistrict.voters
		dem=Math.max(c-.5,0)*2
		rep=(.5-Math.min(c,.5))*2
		b=rep*255
		r=dem*255
		return rgb(r,0,b)
	},
	PredictedWinner:function (tile) {
		tileDistrict=districts[tile.district]
		r=tileDistrict.poll>=0 ? 255 : 0
		b=tileDistrict.poll<=0 ? 255 : 0
		return rgb(r,0,b)
	},
    PopulationDensity:function (tile) {
		tileDistrict=districts[tile.district]
		g=tileDistrict.voters/tileDistrict.tiles.length*255
		return rgb(0,g,0)
	},
	// Winner:function(tile) {
	// 	return districts[tile.district].poll>0 ? rgb(tile.district*32+20,0,0) : rgb(0,0,tile.district*32+20);
	// },
	Districts:function(tile) {
		tileDistrict=districts[tile.district]
		if (tile.district!=0) {
			return "#"+tileDistrict.color;
		}
		else {
			return (tile.x+tile.y)%2==0 ? "#000000" : "#505050";
		}
	},
	Compactness:function(tile) {
		tileDistrict=districts[tile.district].tiles
		let posX=tileDistrict.sort(function(a, b){
			return a.x-b.x
		})
		let width=Math.abs(posX[0].x-posX[posX.length-1].x)

		let posY=tileDistrict.sort(function(a, b){
			return a.y-b.y
		})
		let height=Math.abs(posY[0].y-posY[posY.length-1].y)
		let ratio=width/height
		ratio-=Math.floor(ratio)
		return rgb(ratio*255,0,0)
	},
	WastedVote:function(tile) {
		tileDistrict=districts[tile.district]
		repVoters=(tileDistrict.voters+tileDistrict.poll)/2
		demVoters=tileDistrict.voters-repVoters
		perc=(tileDistrict.voters-Math.abs(repVoters-demVoters))/tileDistrict.voters
		return rgb(perc*255,0,0)
	}
}
var Current_ColorMode=ColorModes["Districts"]

function arrayMin(arr) {
  var len = arr.length, min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
};

function arrayMax(arr) {
  var len = arr.length, max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
};

var BrushModes={
	District:function (x,y) {
		// grid[Math.floor(x)][Math.floor(y)].district=1
		ChangeTileDistrict(Math.floor(x),Math.floor(y),1)
	},
	Voter:function (x,y) {
		// grid[Math.floor(x)][Math.floor(y)].district=1
		CreateVoter(0,x,y)
	},
}
var Current_BrushMode=BrushModes["District"]


//create a checkerboard two dimensional array grid 
function InitializeGrid() {
	grid=[];
	for (var x=0; x<gridWidth; x++) {
		grid[x]=[]
		for (var y=0; y<gridHeight; y++) {
			ctx.fillStyle=(x+y)%2==0 ? "#000000" : "#505050";
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
			grid[x][y]={votes:0,district:0,winner:0,x:x,y:y,flag:0,voters:0};
			districts[0].tiles.push(grid[x][y]);
		}
	}
}

//just randomly loops around the grid as a worm does
function RandomWorm() {
	var rndDirection=Math.floor(Math.random()*4);
	worm.x=Math.abs((worm.x+dirX[rndDirection])%gridWidth);
	worm.y=Math.abs((worm.y+dirY[rndDirection])%gridHeight);
	ctx.fillStyle="rgb("+worm.c+",255,255)";
	worm.c=(worm.c+1)%255
	ctx.fillRect(worm.x*gridSize,worm.y*gridSize,50,50);
}

//runs until it hits itself!
function SnakeWorm() {
	grid[worm.x][worm.y].district=true;
	if (GetGridProperty(worm.x+worm.dx,worm.y+worm.dy,"district")==true) {
		var foundValid=false;
		for (var i=0; i<4; i++) {
			worm.dx=dirX[i];
			worm.dy=dirY[i];
			if (GetGridProperty(worm.x+worm.dx,worm.y+worm.dy,"district")==false) {
				break;
			}
		}
		if (!foundValid) {
			worm=RandomGridPosition();
			worm.c=0;
		}
	}
	worm.x=Math.abs((worm.x+worm.dx)%gridWidth);
	worm.y=Math.abs((worm.y+worm.dy)%gridHeight);
	ctx.fillStyle="rgb("+worm.c+",255,0)";
	worm.c=(worm.c+1)%255
	ctx.fillRect(worm.x*gridSize,worm.y*gridSize,50,50);
}

function ColorPatches() {
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			//if no one then black else republican red else blue
			ctx.fillStyle=grid[x][y]==0 ? "#000000" : grid[x][y] < 0 ? repColor : demColor;
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
		}
	}
}

function GetGridProperty(x,y,property) {
	if (x<0 || x>=gridHeight || y<0 || y>=gridWidth) return null
	else if (property) {
		return grid[x][y][property]
	}
	return grid[x][y]
}

function DijstraMap(tx,ty) {
	var cand={x:tx,y:ty};
	var step=0;
	var distMap=blankMap();
	distMap[tx][ty]=0;
	do {
		step+=1
		var candnew={}
		cand.forEach(function(ele) {
			for (d=0;d<4;d++) {
				distMap[ele.x][ele.y]=step
				candnew.push({x:ele.x,y:ele.y})
			}
		});
	}
	while (cand.length != 0)
	return distMap;
}
var safetyBreak=0//remove later-just makes sure evil while loops dont run forever!
function FloodDistricts(num_districts) {
	for (var d=0;d<num_districts;d++) {
    	var rx=0;
  		var ry=0;
    	do {
    		let r=RandomGridPosition()
      		safetyBreak++;
    	} while (grid[r.x][r.y].district!=0 && safetyBreak<1000)
    	safetyBreak=0;
    	FloodFill(rx,ry,0,d,50)
  	}
}


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

function FillHoles(replace) {
  for (var x=0; x<16; x++) {
    for (var y=0; y<16; y++) {      
      if (GetSig(x,y,1)>2) {
        grid[x][y].district=replace;
      }
    }
  }
}

function GetSig(x,y,type) {
  var sig=0
  for (var f=0; f<4; f++) {
    if (GetGridProperty(x+dirX[f],y+dirY[f],"district")==type) {
      sig++
    }
  }
  return sig
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
  	DrawDistricts();
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function rgb(r, g, b){
  return "rgb("+r+","+g+","+b+")";
}

function SeedDistrict(DistrictNumber) {
	console.log("Seeding district "+DistrictNumber)
    let r=0
	do {
		r=RandomGridPosition()
		safetyBreak++
	} while (grid[r.x][r.y].district!=0 && safetyBreak<10)
	ChangeTileDistrict(r.x,r.y,DistrictNumber)	
}

function DiamondFill() {
	let districtsOrder=JSON.parse(JSON.stringify(districts));
	districtsOrder.sort(function(a, b){
		if (a.length==0) {
			return 1
		}
		else if (b.length==0) {
			return -1
		}
		else {
			return a.voters-b.voters
		}
	})
	let order=[]
	for (var i=0; i<districtCount;i++) {
		order.push(districtsOrder[i].tiles)
	}
	//choose the district with the least voters and then filter any tiles with all neighbors filled
	let chosen=order[0]
	//probally unnessarcy now remove later
	//issue with generating single district maps
	if (chosen[0].district==0) {
		chosen=order[1];
	}

	if (chosen.length!=0) {		
		chosen=chosen.filter(function(value){
			return GetSig(value.x,value.y,value.district)<4
		})
		//then filter to see if any tiles neighbor empty districts
		let emptyNeighbors=chosen.filter(function(value){
			return GetSig(value.x,value.y,0)>0
		})
		let r=0
		let chosenTile

		if (emptyNeighbors.length!=0 && Math.random()<chanceToPickNonEmpty) {
			r=Math.floor(Math.random()*emptyNeighbors.length)
			chosenTile=emptyNeighbors[r]
		}
		else {
			r=Math.floor(Math.random()*chosen.length)
			chosenTile=chosen[r]
		}
		FillNeighbors(chosenTile.x,chosenTile.y,chosenTile.district)
	}	
}

function ReleaseNonContiguous() {
	let curf=1
    flagZones=[]
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			grid[x][y].flag=0
		}
	}	
	for (var d=0; d<districtCount; d++) {
		for (var x=0; x<gridWidth; x++) {
			for (var y=0; y<gridHeight; y++) {
				if (grid[x][y].district!=0 && grid[x][y].flag==0) {
          			flagZones[curf]=[]
					grow_contiguous_district(x,y,grid[x][y].district,curf)
					curf+=1
				}
			}
		}
	}
  	for (var f=1; f<flagZones.length;f++) {
  		for (var l=f+1; l<flagZones.length; l++) {
    		let f1=flagZones[f]
    		let f2=flagZones[l]
    		if (f1[0] && f2[0]) {
     			if (f1[0].district==f2[0].district) {
        			if (f1.length>f2.length) {
          				while (f2.length!=0) {
            				var tile=f2.pop()
              				ChangeTileDistrict(tile.x,tile.y,0);
          				}
        			}
        			else {
         				while (f1.length!=0) {
            				var tile=f1.pop()
            				ChangeTileDistrict(tile.x,tile.y,0);
          				}        
        			}
      			}   
  			}
    	}
  	}
}
function grow_contiguous_district(posx,posy,target,replace) {
  var pos=GetGridProperty(posx,posy)
  if (pos == null || pos.flag==replace || pos.district!=target) return;
  grid[posx][posy].flag=replace;
  flagZones[replace].push(pos);
  for (var f=0; f<4;f++) {
    grow_contiguous_district(posx+dirX[f], posy+dirY[f],target, replace); 
  }
}

function FillNeighbors(x,y,target,replace) {
	var order=[0,1,2,3]
	order=shuffle(order);

 	for (var f=0; f<4;f++) {
    	ChangeTileDistrict(x+dirX[order[f]], y+dirY[order[f]], target, replace); 
  	}
}

function ChangeTileDistrict(x,y,replace) {
	var self=GetGridProperty(x,y)
	if (self==null || self.district==replace) return
	var newDistrict=districts[replace];
	var oldDistrict=districts[self.district];
	oldDistrict.tiles.splice(oldDistrict.tiles.indexOf(self),1);
	if (oldDistrict.tiles.length==0 && self.district!=0) {
		SeedDistrict(self.district);
	}
	newDistrict.tiles.push(self);
	oldDistrict.voters-=self.voters;
	newDistrict.voters+=self.voters;
	oldDistrict.poll-=self.votes;
	newDistrict.poll+=self.votes;
	self.district=replace;
}

// var colors=["red","green","blue","yellow"]
function drawDistrictBorders() {
	for (x=0;x<gridWidth;x++) {
		for (y=0;y<gridHeight;y++) {
			var currentDistrict=grid[x][y].district
			for (i=0;i<4;i++) {
				var otherDistrict=GetGridProperty(x+dirX[i],y+dirY[i],"district")
				if (otherDistrict && otherDistrict!=currentDistrict) {
				    ctx.fillStyle="white"
				    // var w = gridSize*dirX[i]
				    // var h = gridSize*dirY[i]
				    //correct for edges gridSize/20
				    let w=gridSize/8+Math.abs(dirY[i])*gridSize
				    let h=gridSize/8+Math.abs(dirX[i])*gridSize
				 //    if (Math.abs(dirY[i])!=0) {
				 //    	w=gridSize
				 //    }
					// if (Math.abs(dirX[i])!=0) {
				 //    	h=gridSize
				 //    }			    
				    let x_center=-gridSize/16
				    let y_center=-gridSize/16

				    // let x_center=0
				    // let y_center=0
				    				 //    if (dirY[i]==1) {
				 //    	x_center-=gridSize/16
				 //    	// w+=gridSize/10
				 //    }
					// else if (dirX[i]==-1) {
				 //    	x_center+=gridSize/16

				 //    }		
			    	// if (dirY[i]==1) {
				    // 	x_center+=gridSize/8
				    // 	y_center-=gridSize/16
				    // }
				    // else if (dirY[i]==-1) {
				    // 	x_center-=gridSize/8
				    // 	y_center+=gridSize/16
				    // }

			    	// if (dirX[i]==1) {
				    // 	y_center-=gridSize/8
				    // 	x_center+=gridSize/16
				    // }
				    // else if (dirX[i]==-1) {
				    // 	y_center+=gridSize/8
				    // 	x_center-=gridSize/16
				    // }			    -sine(dirX[i])*w-sine(dirY[i])*h
			        ctx.fillRect(
			    	x*gridSize+sine(dirX[i])*gridSize+x_center,
			    	y*gridSize+sine(dirY[i])*gridSize+y_center,
			    	w,
			    	h);
			    	// ctx.fillStyle="white"
			    	// ctx.fillRect(x*gridSize,y*gridSize,1,1);
				}
			}
		}
	}
}

function sine(a) {
	if (a<=0) {
		return 0
	}
	else {
		return 1
	}
}

// c.addEventListener('click', function() { }, false);

var elem = c,
    elemLeft = elem.offsetLeft,
    elemTop = elem.offsetTop,
    context = elem.getContext('2d'),
    elements = [];

// Add event listener for `click` events.
elem.addEventListener('click', function(event) {
    var x =(event.pageX-elemLeft)/gridSize,
        y =(event.pageY-elemTop)/gridSize;
    // console.log("x"+x+" y"+y)
    // CreateVoter(0,x,y)
    Current_BrushMode(x,y)
    // console.log(grid[Math.floor(x/gridSize)][Math.floor(y/gridSize)])
    // Collision detection between clicked offset and element.
    // elements.forEach(function(element) {
    //     if (y > element.top && y < element.top + element.height 
    //         && x > element.left && x < element.left + element.width) {
    //         alert('clicked an element');
    //     }
    // });

}, false);