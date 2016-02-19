var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    lastX = 0,
    lastY = 0,
    maxX  = 0,
    maxY  = 0,
    minX  = 0,
    minY  = 0,
    dot_flag = false;
var borderVertices = [];
//in pixel
//var gridCellSize = 10;
var pointDistance = 400;
var pointDistance1 = Math.sqrt(pointDistance);
//mesh points.
var borderPoints = [];
var contour = [];
var steiner = [];
var triangles = [];
var arrayDistance = null;
//var innerPoints = [];

var x = "black",
    y = 2;

function init () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext("2d");
    fullCanvas();
    w = canvas.width;
    h = canvas.height;
    console.log("init", w, h);

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e);
        //connectEndPoint();
        fillBorderBruteForce(maxX, minX, maxY, minY, borderVertices);
        getMesh();
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
}

function draw () {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.stroke();
  ctx.closePath();
  ctx.strokeStyle = x;
  ctx.lineWidth = y;
  var distance = distance2(lastX, lastY, currX, currY);

  if (distance == pointDistance ) {
    //console.log("distance = " + distance);
    createVertex(currX,currY);
  }else if(distance > pointDistance){
    //console.log("distance > " + distance);
    t = Math.sqrt(pointDistance / distance);
    var cX = lastX + t*(currX - lastX);
    var cY = lastY + t*(currY - lastY);
    //console.log(distance2(lastX,lastY,cX,cY));
    createVertex(cX, cY);
  }
}

function findxy (res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - $('canvas').offset().left;
        currY = e.clientY - canvas.offsetTop;
        maxX = currX;
        minX = currX;
        maxY = currY;
        minY = currY;
        createVertex(currX,currY);

        flag = true;
        dot_flag = true;
        if (dot_flag) {

            ctx.beginPath();
            ctx.fillStyle = x;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();

            dot_flag = false;
        }
    }
    if (res == 'up' || res == "out") {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - $('canvas').offset().left;
            currY = e.clientY - canvas.offsetTop;
            console.log(e.clientX, currX, canvas.offsetTop);
            draw();
        }
    }
}

function createVertex (valueX, valueY) {
  lastX = currX;
  lastY = currY;
  if (lastX > maxX) maxX = lastX;
  if (lastX < minX) minX = lastX;
  if (lastY > maxY) maxY = lastY;
  if (lastY < minY) minY = lastY;
  var style = ctx.fillStyle;
  ctx.fillStyle = "#02E020";
  ctx.beginPath();
  ctx.arc(valueX,valueY,2,0,2*Math.PI);
  ctx.fill();
  ctx.fillStyle = style;
  point = [valueX,valueY];
  borderVertices.push(point);
  contour.push({x:valueX, y:valueY, id:(contour.length+1)});
}

function fullCanvas() {
    var sidebar = $('nav').width();
    var width  = window.innerWidth;//canvas.clientWidth * window.devicePixelRatio | 0;
    var height = window.innerHeight;//canvas.clientHeight * window.devicePixelRatio | 0;
    //console.log(width, height);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function distance2 (aX, aY, bX, bY){
  return (aX - bX)*(aX - bX) + (aY - bY)*(aY - bY);
}

function fillBorderBruteForce (maxPointX,minPointX, maxPointY,minPointY , borderVertices) {
  console.log("entrei", maxX, minX, maxY, minY);
  var odd = false;
  var fillPoints = [];
  for (var i = minPointX - pointDistance1; i < maxPointX; i+= pointDistance1) {
    var style = ctx.fillStyle;
        ctx.fillStyle = "#E0A000";
        ctx.beginPath();
        ctx.arc(i,minPointY-2*pointDistance1,2,0,2*Math.PI);
        ctx.fill();
        ctx.fillStyle = style;
    for (var j = minPointY - pointDistance1; j < maxPointY; j+= pointDistance1) {
      odd = false;//test number os crossings with edge for the segment tha goes:
      var point = [i,j];//from the current point...
      var lastpoint = [i,minPointY-2*pointDistance1];//to the first one on this column.
      
      for (var k = 0; k < borderVertices.length ; k ++){
        var a = (k+1) % borderVertices.length;
        var intersected = intersect(borderVertices[k][0],borderVertices[k][1],
                                    borderVertices[a][0],borderVertices[a][1],
                                    lastpoint[0],lastpoint[1],
                                    point[0],point[1]);
        if(intersected) {
          odd = !odd;
        }
      }

      if (odd) {
        fillPoints.push(point);
        steiner.push({x: i, y: j, id: (steiner.length + 1)});
        var style = ctx.fillStyle;
        ctx.fillStyle = "#00F0A0";
        ctx.beginPath();
        ctx.arc(point[0],point[1],2,0,2*Math.PI);
        ctx.fill();
        ctx.fillStyle = style;
      }
    }
  }

  return fillPoints;
}


function ccw (aX, aY, bX, bY, cX, cY) {
  return (cY-aY)*(bX-aX) > (bY-aY)*(cX-aX);
}

function intersect (aX, aY, bX, bY, cX, cY,dX, dY) {
  return ccw(aX, aY, cX, cY, dX, dY) !=
          ccw(bX, bY, cX, cY, dX, dY) && ccw(aX, aY, bX, bY, cX, cY) !=
          ccw(aX, aY, bX, bY, dX, dY);
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

function getMesh () {
  getDistanceVector();
  
  var swctx = new poly2tri.SweepContext(contour);
  swctx.addPoints(steiner);
  swctx.triangulate();
  triangles = swctx.getTriangles();
  triangles.forEach(function(t) {
    t.getPoints().forEach(function(p) {
        //console.log(p.id);
    });
    //console.log("X");
    //draw tri
    ctx.beginPath();
    ctx.moveTo(t.getPoint(0).x, t.getPoint(0).y);
    ctx.lineTo(t.getPoint(1).x, t.getPoint(1).y);
    ctx.lineTo(t.getPoint(2).x, t.getPoint(2).y);
    ctx.closePath();
    ctx.stroke();
  });
  
  debugInflate();
}

function getDistanceVector () {
  arrayDistance = new Array(steiner.length);
  arrayDistance.fill(-1);

  //calculate the distance of every steiner point to all he segments on the border
  for (var j = 0; j < steiner.length; j++) {
      for (var i = 0; i < contour.length; i++) {
        var index = (i == (contour.length-1)) ? 0 : i+1;
        //console.log(i, index);
        var distance = pointToSegment(contour[i], contour[index], steiner[j]);
        //var distance = distance2(steiner[j].x, steiner[j].y, contour[i].x, contour[i].y)
        if (arrayDistance[j] == - 1 || arrayDistance[j] > distance) {
          arrayDistance[j] = distance;
        } 
      };
  };

  //for all pS: if arrayDistance[pS.id] < pointDistance: remove pS
  /**/
  steiner = steiner.filter( function (p) {
    if (arrayDistance[p.id - 1] >= pointDistance) {
     return true;
   } else {
    arrayDistance[p.id - 1] = -1;
    return false;
   }
  });

  arrayDistance = arrayDistance.filter( function (d) {
    return d != -1;
  });
  /**/

  var aD1 = arrayDistance.map (function (p) {
     return p;
  });
  console.log(aD1);
  
}

function pointToSegment (a, b, p) {
  var vecP = [p.x-a.x, p.y-a.y];
  var vecR = [b.x-a.x, b.y-a.y];
  var lenVecR = Math.sqrt(vecR[0]*vecR[0]+vecR[1]*vecR[1]);
  var lenProj = vecP[0]*(vecR[0]/lenVecR) + vecP[1]*(vecR[1]/lenVecR);
  if (lenProj <= 0) { //closer to a
    return distance2(p.x,p.y,a.x,a.y);
  } else if (lenProj >= lenVecR) { //closer to b
    return distance2(p.x,p.y,a.x,a.y);
  } else {//projection lies inside projection
    return distance2(p.x, p.y, a.x+(lenProj*vecR[0]/lenVecR), a.y+(lenProj*vecR[1]/lenVecR));
  }
}

function debugInflate () {
  var maxDistance = 0;
  var minDistance = -1;
  arrayDistance.map( function (d) {
    if (d > maxDistance) {
      maxDistance = d;
    };
    if (minDistance == -1 || minDistance > d) {
      minDistance = d;
    };
  });

  maxDistance = maxDistance - minDistance;

  var normalArrayDistance = arrayDistance.map( function (d) {
    return (d - minDistance) / maxDistance;
  });
  console.log(normalArrayDistance);
  var style = ctx.fillStyle;
  normalArrayDistance.map( function (d, i) {
    var value = parseInt(d*255);
    //console.log(value);
    ctx.beginPath();
    ctx.arc( steiner[i].x, steiner[i].y ,pointDistance1/2.0, 0, 2*Math.PI);
    ctx.fillStyle = "rgb("+value+","+value+","+value+")";
    ctx.fill();
  } );
}
