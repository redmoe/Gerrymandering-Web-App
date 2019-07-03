	// for (var d=1; d<districtCount-1;d++) {
	// let borderDistricts=[];
	// //borderDistricts[0]=[]
	// for (d=1; d<districts.length; d++) {
	// 	borderDistricts[d-1]={number:d-1,tiles:[]}
	// }
	// //console.log(borderDistricts)
	// for (x=0; x<gridWidth; x++) {
	// 	for (y=0; y<gridHeight; y++) {
	// 		var dis=grid[x][y].district;
	// 		//console.log(dis)
	// 		if (dis!=0 && GetSig(x,y,dis)<4) {
	// 			borderDistricts[dis-1].tiles.push({x:x,y:y})
	// 		}
	// 	}
	// }
	// do {
	// 	borderDistricts=borderDistricts.sort(function(a,b){return a.tiles.length-b.tiles.length});
	//  	r=borderDistricts[0].tiles[Math.floor(Math.random()*borderDistricts[0].tiles.length)]
	//  	console.log(borderDistricts);
	//  	if (r==null) return;
	//  	FillNeighbors(r.x,r.y,0,borderDistricts[0].number+1);
	//  	borderDistricts[0].tiles.splice(r,1);
	//  	while (borderDistricts.length!=0 && borderDistricts[0].tiles.length==0) {
	//  		borderDistricts.shift();
	//  	}
	// } while (borderDistricts.length!=0 && safetyBreak<100)
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
	// 		FillNeighbors(order[0][0].x,order[0][0].y,0,d);
	// 		order[0].splice(r,1);
	// 	}
	//     if (order[0].length==0) {
	// 		order.shift();
	// 		console.log(order);
	// 	}
	// 	safetyBreak++;
	// } while (order.length!=0 && safetyBreak<100)
	// if (safetyBreak>100) {
	// 	safetyBreak=0
	// 	console.log("broke");
	// }

	// function FloodFill(posx,posy,target,replace,amount) {
//   var pos=GetGridProperty(posx,posy,"district")
//   if (pos == null || pos!=target || amount==0) return amount;
//   grid[posx][posy].district=replace;
//   amount--;
//   GraphicStack();
//   var order=[0,1,2,3];
//  /// order=shuffle(order);
//   for (var f=0; f<4;f++) {
//     amount=FloodFill(posx+dirX[order[f]], posy+dirY[order[f]], target, replace,amount); 
//     if (amount==0) return amount;
//   }
//   return amount  
// }

// function FloodFill(posx,posy,target,replace,Tproperty,Rproperty) {
//   var pos=GetGridProperty(posx,posy,property)
//   if (pos == null || pos!=target || amount==0) return amount;
//   grid[posx][posy][property]=replace;
//  // amount--;
//  // GraphicStack();
//   //var order=[0,1,2,3];
//  /// order=shuffle(order);
//   for (var f=0; f<4;f++) {
//     amount=FloodFill(posx+dirX[order[f]], posy+dirY[order[f]], target, replace, property); 
//     if (amount==0) return amount;
//   }
//   return amount  
// }

// function grid_stack() {
//   // console.clear();
//   var message="";
//   for (var x=0; x<16; x++) {
//     message+="\n"
//     for (var y=0; y<16; y++) {
//       message+=grid[x][y].flag+" ";
//     }
//   }
//  // console.log(message);
// }
//	districts[replace]++;
	//console.log("Filled");
	//districtPositions[self.district].splice(districtPositions[self.district].indexOf(self),1);
	//districtPositions[replace].push(self)
		//console.log(order);
	//console.log(districtPositions)
	//let order=JSON.parse(JSON.stringify(districtPositions));
	// order.sort(function(a, b){
	// 	if (a.length==0) {
	// 		return 1
	// 	}
	// 	else if (b.length==0) {
	// 		return -1
	// 	}
	// 	else {
	// 		return a.length-b.length
	// 	}
	// 	// (a.length==0 ? return -1 : return a.length-b.length
	// })