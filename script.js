var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var grid=[];
var voters=[];

var gridWidth=16;
var gridHeight=16;
var gridSize=30;

// var voterImg = document.getElementById("voter");
// voterImg.width=gridSize;
// voterImg.height=gridSize;

c.height=gridHeight*gridSize;
c.width=gridWidth*gridSize;

// var districtColors=["#FA8072","#228B22","#87CEEB","#FF00FF","#FF1493","	#2F4F4F","#FFDEAD"]

var districtColors=["#000000","#DC143C","#FF4500","#FFFF00","#00FF00","#87CEFA","#FF00FF","#00FFFF"]
//var graphicBuffer=[]

var numberOfVoters=100;
var democratPercentage=.5;
var totalRepublicans=numberOfVoters*(1-democratPercentage);
var totalDemocrats=numberOfVoters*democratPercentage;

var districtCount=7;
var requiredVoters=districtCount/numberOfVoters;
var districts=[]
//var districtPositions=[[],[],[],[],[],[],[],[],[]]
//var polls=[-1,0,0,0,0,0,0,0]

var dirX=[1,-1,0,0];
var dirY=[0,0,1,-1];

var republicanWins=0;
var democratWins=0;

function CreateVoters (number,party) {
	for (var i=0;i<number+1;i++) {
		var x=Math.random()*gridWidth;
		var y=Math.random()*gridHeight;
		var tile=grid[Math.floor(x)][Math.floor(y)]
		// ctx.fillText(icon, x*gridSize, y*gridSize);
		voters.push({x:x,y:y,party:party});
		tile.votes+=party;
		tile.voters+=1
	}
}
function CreateDistrictPrimatives() {
	for (var i=0;i<=districtCount;i++) {
		districts.push({voters:0,tiles:[],poll:0,color:districtColors[i]})
	}
}


function RandomGridPosition() {
	return {x:Math.floor(Math.random()*gridWidth),y:Math.floor(Math.random()*gridHeight)}
}
var worm={x:0,y:0,dx:1,dy:0,c:0};


//runs the start of the program
function setup() {
	CreateDistrictPrimatives()
	InitializeGrid()
	CreateVoters(totalDemocrats,-1);
	CreateVoters(totalRepublicans,1);
	// worm.x=RandomGridPosition().x;
	// worm.y=RandomGridPosition().y;
	//FloodDistricts(districtCount);
	//DistrictWinners();
	seed_districts();
	//draw()
	update();
 //ColorPatches()	
}
var drawGame=true
//runs every frame
function update(timestamp){
	if (districts[0].tiles.length!=0) {
		diamond_fill();
      //  console.log(districts[0])
		release_non_contiguous();
		requestAnimationFrame(update);	
		if (drawGame) {
			drawGame=false;
			setTimeout(draw,0)
		}
	}
	else {
		DrawWinners();
		for (var i=0; i<districtCount; i++) {
			console.log(districts[i].poll);
		}
		return;
	}
}

//runs at a set time
function draw() {
	var frame=grid;
	//if (graphicBuffer.length!=0) {
	//	frame=graphicBuffer.shift();
		DrawDistricts(grid);
	//	console.log("buffering");
	//}
		drawGame=true;
	//}
	//else {
		//DrawWinners();
		//var txt = document.getElementById("win");
		//txt.innerHTML="R "+republicanWins+" to D "+democratWins+". "+(democratWins>republicanWins ? "Democrats" : "Republicans")+" win!"
	//}
	DrawVoters(grid);
}

function DrawDistricts(frame) {
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			let tile=frame[x][y]
			let tileDistrict=tile.district;
			if (tileDistrict!=0) {
				ctx.fillStyle=districts[tileDistrict].color;
			}
			else {
				ctx.fillStyle=(x+y)%2==0 ? "#000000" : "#505050";
			}
	        ctx.fillRect(x*gridSize,y*gridSize,50,50);
            ctx.fillStyle="white"
      //"("+x+" "+y+") "+
            ctx.fillText(tile.flag,x*gridSize,y*gridSize+gridSize)
		}
	}
}

function DrawVoters(frame) {
	ctx.font = (gridSize/1.25)+"px Arial";
	voters.forEach(function(v) {
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
		//ctx.drawImage(voterImg,v.x*gridSize,v.y*gridSize)
	});
}

// function DistrictWinners() {
// 	for (var x=0; x<gridWidth; x++) {
// 		for (var y=0; y<gridHeight; y++) {
// 			if (grid[x][y].district!=0) {
// 				polls[grid[x][y].district]+=grid[x][y].votes;
// 			}
// 		}
// 	}
// 	for (var f=1; f<polls.length; f++) {
// 		polls[f]=Math.round(polls[f]);
// 		if (polls[f]>0) {
// 			republicanWins++;
// 		}
// 		else {
// 			democratWins++;
// 		}
// 	}
// 	for (x=0; x<gridWidth; x++) {
// 		for (y=0; y<gridHeight; y++) {
// 			grid[x][y].winner=polls[grid[x][y].district];
// 		}
// 	}
// }

function GetDistrictCenter(district) {
	let x=0;
	let y=0;
	for (var i=0; i<district.tiles.length;i++) {
		x+=district.tiles[i].x;
		y+=district.tiles[i].y;
		console.log(x);
	}
	x/=district.tiles.length;
	y/=district.tiles.length;
	console.log(x);
	console.log(y);
	return {x:x,y:y}
}

function DrawWinners() {
	for (var i=1; i<=districtCount;i++) {
		console.log(i);
		if (districts[i].poll<0) {
			republicanWins++;
		}
		else {
			democratWins++;
		}
	}
	for (var x=0; x<gridWidth; x++) {
		for (var y=0; y<gridHeight; y++) {
			if (grid[x][y].district!=0) {
				
			//	ctx.fillStyle= grid[x][y].winner>0 ? rgb(grid[x][y].district*32+20,0,0) : rgb(0,0,grid[x][y].district*32+20);
				ctx.fillStyle=districts[grid[x][y].district].poll>0 ? rgb(grid[x][y].district*32+20,0,0) : rgb(0,0,grid[x][y].district*32+20);

				ctx.fillRect(x*gridSize,y*gridSize,50,50);
			}
		}
	}
	ctx.font = (gridSize/2)+"px Arial";
	ctx.fillStyle="#ffffff"	
	for (var i=1;i<=districtCount;i++) {
	    let pos = GetDistrictCenter(districts[i])
	    let stats="District "+i+"\nVoters "+districts[i].voters+"\nPoll "+districts[i].poll
		ctx.fillText(stats,pos.x*gridSize-ctx.measureText(stats).width/2,pos.y*gridSize);


	}
	var txt = document.getElementById("win");
	txt.innerHTML="R "+republicanWins+" to D "+democratWins+". "+(democratWins>republicanWins ? "Democrats" : "Republicans")+" win!"		
}

//create a checkerboard two dimensional array grid 
function InitializeGrid() {
	for (var x=0; x<gridWidth; x++) {
		grid[x]=[]
		for (var y=0; y<gridHeight; y++) {
			ctx.fillStyle=(x+y)%2==0 ? "#000000" : "#505050";
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
			grid[x][y]={votes:0,district:0,winner:0,x:x,y:y,flag:0,voters:0};
			districts[0].tiles.push(grid[x][y]);
		//	districtPositions[0].push(grid[x][y])
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
			ctx.fillStyle=grid[x][y]==0 ? "#000000" : grid[x][y] < 0 ? "#FF0000" : "#0000FF";
			ctx.fillRect(x*gridSize,y*gridSize,50,50);
		}
	}
}

function GetGridProperty(x,y,property) {
	if (x<0 || x>=gridHeight || y<0 || y>=gridWidth) return null
	else if (property) {
		console.log(y);
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
    	// FillHoles(d);       
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
// function GraphicStack() {
// 	// let frame=grid.slice(0);
// 	let frame=JSON.parse(JSON.stringify(grid));
// 	graphicBuffer.push(frame);
// }  
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
function seed_districts() {
	for (var d=1; d<districtCount+1;d++) {
    let r=0
		do {
			r=RandomGridPosition()
			safetyBreak++
		} while (grid[r.x][r.y].district!=0 && safetyBreak<10)
		ChangeTileDistrict(r.x,r.y,d)
		//console.log(d);
	}	
}


function diamond_fill() {
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
//	console.log(districtsOrder)
	let order=[]
	for (var i=0; i<districtCount;i++) {
		order.push(districtsOrder[i].tiles)
		//console.log(districtsOrder[i].tiles);
	}

	let chosen=order[0]
	if (chosen[0].district==0) {
		chosen=order[1];
	}
	//console.log(chosen[0].district);
	let r=Math.floor(Math.random()*chosen.length)
	chosenTile=chosen[r]
	while (GetSig(chosenTile.x,chosenTile.y,chosenTile.district)>=4) {
		console.log("swapped");
	 	r=Math.floor(Math.random()*chosen.length);
	 	chosenTile=chosen[r]
	}
	FillNeighbors(chosenTile.x,chosenTile.y,chosenTile.district)
}

var flagZones=[]
function release_non_contiguous() {
	let curf=1
    flagZones=[]
//  var flagTypes=[]
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
         		// flagTypes[curf]=gridDistrict
					grow_contiguous_district(x,y,grid[x][y].district,curf)
					curf+=1
				}
			}
		}
	}
 //console.log(flagZones)
  for (var f=1; f<flagZones.length;f++) {
  	for (var l=f+1; l<flagZones.length; l++) {
    let f1=flagZones[f]
    let f2=flagZones[l]
    //console.log(f+" "+l)
   // console.log(flagZones.length)
    //console.log(f2)
    if (f1[0] && f2[0]) {
     if (f1[0].district==f2[0].district) {
        if (f1.length>f2.length) {
          while (f2.length!=0) {
            //console.log("looped");
            var tile=f2.pop()
            //console.log("popped "+tile.x+" "+tile.y)
              ChangeTileDistrict(tile.x,tile.y,0);
          }
        }
        else {
          while (f1.length!=0) {
            var tile=f1.pop()
            //console.log("popped "+tile.x+" "+tile.y)
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
	newDistrict.tiles.push(self);
	oldDistrict.voters-=self.voters;
	newDistrict.voters+=self.voters;
	oldDistrict.poll-=self.votes;
	newDistrict.poll+=self.votes;
	//console.log(self.votes)
	self.district=replace;

}
setup();
