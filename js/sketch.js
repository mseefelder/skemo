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
var pointDistance = 2500;
var pointDistance1 = Math.sqrt(pointDistance);
//mesh points.
var borderPoints = [];
var contour = [];
//var innerPoints = [];

var x = "black",
    y = 2;

function init() {
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
        //fillBorder(maxX, minX, maxY, minY, borderVertices);
        triangles();
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
}

function draw() {
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

function findxy(res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
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
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;
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

function fillBorder (maxPointX,minPointX, maxPointY,minPointY , borderVertices) {
  console.log("entrei");
  var odd = false;
  var fillPoints = [];
  for (var i = minPointX; i <= maxPointX; i+= pointDistance1 ) {
    for (var j = minPointY; j < maxPointY; j+= pointDistance1){
      var point = [i,j];
      var lastpoint = [i,j-pointDistance];
      /*for (var k = 0; k < borderVertices.length ; k ++){
        var x = (k+1)% borderVertices.length;
        var intersected = intersect(borderVertices[k][0],borderVertices[k][1],
                                    borderVertices[x][0],borderVertices[x][1],
                                    lastpoint[0],lastpoint[1],
                                    point[0],point[1]);
        console.log(intersected);
        if(intersected) {
          odd = !odd;
        }
      }*/
      if (!odd) {
        fillPoints.push(point);
        var style = ctx.fillStyle;
        ctx.fillStyle = "#02E020";
        ctx.beginPath();
        ctx.arc(point[0],point[1],2,0,2*Math.PI);
        ctx.fill();
        ctx.fillStyle = style;
        borderVertices.push(point);
      }
    }
  }
  return fillPoints;
}


function ccw(aX, aY, bX, bY, cX, cY) {
  return (cY-aY)*(bX-aX) > (bY-aY)*(cX-aX);
}

function intersect(aX, aY, bX, bY, cX, cY,dX, dY) {
  return ccw(aX, aY, cX, cY, dX, dY) !=
          ccw(bX, bY, cX, cY, dX, dY) && ccw(aX, aY, bX, bY, cX, cY) !=
          ccw(aX, aY, bX, bY, dX, dY);
}

function triangles() {
  var swctx = new poly2tri.SweepContext(contour);
  swctx.triangulate();
  var triangles = swctx.getTriangles();
  triangles.forEach(function(t) {
    t.getPoints().forEach(function(p) {
        console.log(p.id);
    });
    console.log("X");
    //draw tri
    ctx.beginPath();
    ctx.moveTo(t.getPoint(0).x, t.getPoint(0).y);
    ctx.lineTo(t.getPoint(1).x, t.getPoint(1).y);
    ctx.lineTo(t.getPoint(2).x, t.getPoint(2).y);
    ctx.closePath();
    ctx.stroke();
  });
}