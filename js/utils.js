function fullCanvas(canvas) {
    var sidebar = $('nav').width();
    console.log("Sidebar: ", sidebar);
    var width  = window.innerWidth;//canvas2d.clientWidth * window.devicePixelRatio | 0;
    var height = window.innerHeight;//canvas2d.clientHeight * window.devicePixelRatio | 0;
    //console.log(width, height);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function distance2  (aX, aY, bX, bY){
  return (aX - bX)*(aX - bX) + (aY - bY)*(aY - bY);
}

function distance1 (aX, aY, bX, bY){
  return Math.sqrt(distance2(aX, aY, bX, bY));
}

function ccw (aX, aY, bX, bY, cX, cY) {
  return (cY-aY)*(bX-aX) > (bY-aY)*(cX-aX);
}

function intersect (aX, aY, bX, bY, cX, cY,dX, dY) {
  return ccw(aX, aY, cX, cY, dX, dY) !=
          ccw(bX, bY, cX, cY, dX, dY) && ccw(aX, aY, bX, bY, cX, cY) !=
          ccw(aX, aY, bX, bY, dX, dY);
}

function pointToSegment (a, b, p) {
  //vector from p to a
  var vecP = [p.x-a.x, p.y-a.y];
  //vector from p to b
  var vecR = [b.x-a.x, b.y-a.y];
  //Length of vecR
  var lenVecR = Math.sqrt(vecR[0]*vecR[0]+vecR[1]*vecR[1]);
  //Length of vecP projection onto vecR
  var lenProj = vecP[0]*(vecR[0]/lenVecR) + vecP[1]*(vecR[1]/lenVecR);
  if (lenProj <= 0) { //closer to a
    return distance2(p.x,p.y,a.x,a.y);
  } else if (lenProj >= lenVecR) { //closer to b
    return distance2(p.x,p.y,a.x,a.y);
  } else {//projection lies inside projection
    return distance2(p.x, p.y, a.x+(lenProj*vecR[0]/lenVecR), a.y+(lenProj*vecR[1]/lenVecR));
  }
}

function pointToSegmentHope (a, b, p) {
  var vecP = [p.x-a.x, p.y-a.y];
  var vecR = [b.x-a.x, b.y-a.y];
  var lenVecR = Math.sqrt(vecR[0]*vecR[0]+vecR[1]*vecR[1]);
  var lenProj = vecP[0]*(vecR[0]/lenVecR) + vecP[1]*(vecR[1]/lenVecR);
  if (lenProj <= 0) { //closer to a
    return {d: distance2(p.x,p.y,a.x,a.y), vector: {x: a.x-p.x, y: a.y-p.y}};
  } else if (lenProj >= lenVecR) { //closer to b
    return {d: distance2(p.x,p.y,b.x,b.y), vector: {x: b.x-p.x, y: b.y-p.y}};
  } else {//projection lies inside projection
    return {d: distance2(p.x, p.y, a.x+(lenProj*vecR[0]/lenVecR), a.y+(lenProj*vecR[1]/lenVecR)), 
      vector: {  
        x: a.x+(lenProj*vecR[0]/lenVecR)-p.x, 
        y: a.y+(lenProj*vecR[1]/lenVecR)-p.y
      }
    };
  }
}

function normalizedProjectionLength (ax,ay,bx,by) {
  var p = dot(ax,ay,bx,by);
  p = p/distance1(ax,ay,0,0);
  p = p/distance1(bx,by,0,0);
  return p;
}

function findIntersection (aX, aY, bX, bY, cX, cY,dX, dY) {
  var a1 = aX - bX;
  var b1 = aY - bY;
  var c1 = aX*bY - aY*bX;

  var a2 = cX - dX;
  var b2 = cY - dY;
  var c2 = cX*dY - cY*dX;

  var det = a1*b2-b1*a2;
  var x = (c1*a2 - a1*c2)/det;
  var y = (c1*b2 - b1*c2)/det;

  return [x, y]
}

function dot (ax, ay, bx, by) {
  return (ax*bx)+(ay*by);
}

function bSearch (array, value) {
  var l = array.length;
  if (array[0] > value || array[l] < value) {
    return false;
  }
  else if (array[0] == value || array[l] == value)
  {
    return true;
  }
  var curr = Math.floor(array.length/2.0);
  var down = 0;
  var up = l;
  var prev = -1;
  while(curr != prev) {
    if (array[curr] == value) {
      return true; 
    } else if (array[curr] < value){
      prev = curr;
      down = curr;
      curr = Math.floor((curr+up)/2.0);
    } else if (array[curr] > value) {
      prev = curr;
      up = curr;
      curr = Math.floor((curr+down)/2.0);
    }
  }
  return false;
}