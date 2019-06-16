var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var grid=[];
// var districts=[]
var voters=[];

var gridWidth=16;
var gridHeight=16;
var gridSize=50;

// var districtColors=["#FA8072","#228B22","#87CEEB","#FF00FF","#FF1493","	#2F4F4F","#FFDEAD"]

var districtColors=["#000000","#DC143C","#FF4500","#FFFF00","#00FF00","#87CEFA","#FF00FF","#00FFFF"]
var graphicBuffer=[]

var numberOfVoters=100;
var democratPercentage=.5;
var totalRepublicans=numberOfVoters*(1-democratPercentage);
var totalDemocrats=numberOfVoters*democratPercentage;

var districtCount=7;
var districts=[gridWidth*gridHeight,0,0,0,0,0,0,0]
var polls=    [-1,0,0,0,0,0,0,0]

var dirX=[1,-1,0,0];
var dirY=[0,0,1,-1];

var republicanWins=0;
var democratWins=0;

function CreateVoters (number,party) {
	for (i=0;i<number;i++) {
		var x=Math.random()*gridWidth;
		var y=Math.random()*gridHeight;
		// ctx.fillText(icon, x*gridSize, y*gridSize);
		voters.push({x:x,y:y,party:party});
		grid[Math.floor(x)][Math.floor(y)].votes+=party;
	}
}


function RandomGridPosition() {
	return {x:Math.floor(Math.random()*gridWidth),y:Math.floor(Math.random()*gridHeight)}
}
var worm={x:0,y:0,dx:1,dy:0,c:0};


//runs the start of the program
function setup() {
	InitializeGrid()
	CreateVoters(totalDemocrats,-1);
	CreateVoters(totalRepublicans,1);
	// worm.x=RandomGridPosition().x;
	// worm.y=RandomGridPosition().y;
	//FloodDistricts(districtCount);
	//DistrictWinners();
	seed_districts();

	update();
 //ColorPatches()	
}
var drawGame=true
//runs every frame
function update(timestamp){
	if (districts[0]!=0) {
		console.log("ran");
		diamond_fill();
	}
	

	if (drawGame) {
		drawGame=false;
		setTimeout(draw,.1)
	}
	requestAnimationFrame(update);	
}

//runs at a set time
function draw() {
	var frame=grid;
	if (graphicBuffer.length!=0) {
		frame=graphicBuffer.shift();
		DrawDistricts(frame);
		console.log("buffering");
		drawGame=true;
	}
	else {
		//DrawWinners();
		//var txt = document.getElementById("win");
		//txt.innerHTML="R "+republicanWins+" to D "+democratWins+". "+(democratWins>republicanWins ? "Democrats" : "Republicans")+" win!"
	}
	DrawVoters(frame);
}

function DrawDistricts(frame) {
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			if (frame[x][y].district!=0) {
				ctx.fillStyle=districtColors[frame[x][y].district];
			}
			else {
				ctx.fillStyle=(x+y)%2==0 ? "#000000" : "#505050";
			}
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
		}
	}
}

function DrawVoters(frame) {
	voters.forEach(function(v) {
		ctx.font = "30px Arial";
		var icon="?"
		if (v.party>0) {
			icon="R"
			ctx.fillStyle = "#FF0000";
		}
		else {
			icon="D"
			ctx.fillStyle = "#0000FF";
		}
		ctx.fillText(icon, v.x*gridSize, v.y*gridSize);
	});
}

function DistrictWinners() {
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			if (grid[x][y].district!=0) {
				polls[grid[x][y].district]+=grid[x][y].votes;
			}
		}
	}
	for (f=1; f<polls.length; f++) {
		polls[f]=Math.round(polls[f]);
		if (polls[f]>0) {
			republicanWins++;
		}
		else {
			democratWins++;
		}
	}
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			grid[x][y].winner=polls[grid[x][y].district];
		}
	}
}

function DrawWinners() {
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			if (grid[x][y].district!=0) {
				ctx.fillStyle= grid[x][y].winner>0 ? rgb(grid[x][y].district*32+20,0,0) : rgb(0,0,grid[x][y].district*32+20);
				ctx.fillRect(x*gridSize,y*gridSize,50,50);
			}

		}
	}	
}

//create a checkerboard two dimensional array grid 
function InitializeGrid() {
	for (x=0; x<gridWidth; x++) {
		grid[x]=[]
		for (y=0; y<gridHeight; y++) {
			ctx.fillStyle=(x+y)%2==0 ? "#000000" : "#505050";
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
			grid[x][y]={votes:0,district:0,winner:0};
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
		for (i=0; i<4; i++) {
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
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			//if no one then black else republican red else blue
			ctx.fillStyle=grid[x][y]==0 ? "#000000" : grid[x][y] < 0 ? "#FF0000" : "#0000FF";
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
    		r=RandomGridPosition()
      		safetyBreak++;
    	} while (grid[r.x][r.y].district!=0 && safetyBreak<1000)
    	safetyBreak=0;
    	FloodFill(rx,ry,0,d,50)
    	// FillHoles(d);       
  	}
}

function FloodFill(posx,posy,target,replace,amount) {
  var pos=GetGridProperty(posx,posy,"district")
  if (pos == null || pos!=target || amount==0) return amount;
  grid[posx][posy].district=replace;
  amount--;
  GraphicStack();
  var order=[0,1,2,3];
 /// order=shuffle(order);
  for (var f=0; f<4;f++) {
    amount=FloodFill(posx+dirX[order[f]], posy+dirY[order[f]], target, replace,amount); 
    if (amount==0) return amount;
  }
  return amount  
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
function GraphicStack() {
	// let frame=grid.slice(0);
	frame=JSON.parse(JSON.stringify(grid));
	graphicBuffer.push(frame);
}  
function GetSig(x,y,type) {
  var sig=0
  for (var f=0; f<4; f++) {
    if (GetGridProperty(x+dirX[f],y+dirX[f],"district")==type) {
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
function seed_districts() {
	for (var d=1; d<districtCount+1;d++) {
		do {
			r=RandomGridPosition()
			safetyBreak++
		} while (grid[r.x][r.y].district!=0 && safetyBreak<10)
		fill_self(r.x,r.y,0,d)
	}	
}


function diamond_fill() {
	// for (var d=1; d<districtCount-1;d++) {
	let borderDistricts=[];
	//borderDistricts[0]=[]
	for (d=1; d<districts.length; d++) {
		borderDistricts[d-1]={number:d-1,tiles:[]}
	}
	//console.log(borderDistricts)
	for (x=0; x<gridWidth; x++) {
		for (y=0; y<gridHeight; y++) {
			var dis=grid[x][y].district;
			//console.log(dis)
			if (dis!=0 && GetSig(x,y,dis)<4) {
				borderDistricts[dis-1].tiles.push({x:x,y:y})
			}
		}
	}
	do {
		borderDistricts=borderDistricts.sort(function(a,b){return a.tiles.length-b.tiles.length});
	 	r=borderDistricts[0].tiles[Math.floor(Math.random()*borderDistricts[0].tiles.length)]
	 	console.log(borderDistricts);
	 	if (r==null) return;
	 	fill_neighbors(r.x,r.y,0,borderDistricts[0].number+1);
	 	borderDistricts[0].tiles.splice(r,1);
	 	while (borderDistricts.length!=0 && borderDistricts[0].tiles.length==0) {
	 		borderDistricts.shift();
	 	}
	} while (borderDistricts.length!=0 && safetyBreak<100)
	//console.log("ended");
	//console.log(borderDistricts.sort(function(a, b){return a.length-b.length}))
	//var sort=[1,2,3,4,5,6,7,8]
	// sort=shuffle(sort);
	//borderDistricts=shuffle(borderDistricts)
	// var order=borderDistricts;
	// do {
	//  	order=order.sort(function(a, b){return a.length-b.length})
	//  	if (order[0].length==0) {
	// 		order.shift();
	// 		console.log(order);
	// 	}
	// 	if (order[0].length!=0) {
	// 		r=Math.floor(Math.random()*order[0].length)
	// 		fill_neighbors(order[0][0].x,order[0][0].y,0,d);
	// 		order[0].splice(r,1);
	// 	}
	//     if (order[0].length==0) {
	// 		order.shift();
	// 		console.log(order);
	// 	}
	// 	safetyBreak++;
	// } while (order.length!=0 && safetyBreak<100)
	if (safetyBreak>100) {
		safetyBreak=0
		console.log("broke");
	}
}

function fill_neighbors(x,y,target,replace) {
	var order=[0,1,2,3]
	order=shuffle(order);
 	for (var f=0; f<4;f++) {
    	fill_self(x+dirX[order[f]], y+dirY[order[f]], target, replace); 
  	}
}
function fill_self(x,y,target,replace) {

	var self=GetGridProperty(x,y)
	if (self==null || self.district==replace) return
	districts[target]--;
	districts[replace]++;
	self.district=replace;
	GraphicStack();
}
setup();