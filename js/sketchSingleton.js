var sketch = new function () {

  var self = this;

  this.canvas2d = false;
  this.ctx = false;
  this.flag = false;
  this.prevX = 0;
  this.currX = 0;
  this.prevY = 0;
  this.currY = 0;
  this.lastX = 0;
  this.lastY = 0;
  this.maxX = 0;
  this.maxY = 0;
  this.minX = 0;
  this.minY = 0;
  this.dot_flag = false;
  this.borderVertices = [];
  this.pointDistance = 400;
  this.pointDistance1 = Math.sqrt(this.pointDistance);
  //mesh points.
  this.borderPoints = [];
  this.contour = [];
  this.steiner = [];
  this.triangles = [];
  this.arrayDistance = null;
  this.x = "black";
  this.y = 2;

  this.init2d = function () {
    this.canvas2d = document.getElementById('2dcanvas');
    this.ctx = this.canvas2d.getContext("2d");
    fullCanvas(this.canvas2d);
    this.w = this.canvas2d.width;
    this.h = this.canvas2d.height;
    console.log("init", this.w, this.h);

    //this.canvas2d.addEventListener("mousemove", this.mouseMoveHandle, false);
    //this.canvas2d.addEventListener("mousedown", this.mouseDownHandle, false);
    //this.canvas2d.addEventListener("mouseup", this.mouseUpHandle, false);
    //this.canvas2d.addEventListener("mouseout", this.mouseOutHandle, false);
  };

  this.mouseMoveHandle = function (e) {
    findxy('move', e);
  };

  this.mouseDownHandle = function (e) {
    findxy('down', e);
  };

  this.mouseUpHandle = function (e) {
    findxy('up', e);
    fillBorderBruteForce(self.maxX, self.minX, self.maxY, self.minY, self.borderVertices);
    getMesh();
  };

  this.mouseOutHandle = function (e) {
    findxy('out', e);
  };

  this.draw = function () {
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(this.currX, this.currY);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.strokeStyle = this.x;
    this.ctx.lineWidth = this.y;
    var distance = distance2(this.lastX, this.lastY, this.currX, this.currY);

    if (distance == this.pointDistance ) {
      //console.log("distance = " + distance);
      this.createVertex(this.currX,this.currY);
    }else if(distance > this.pointDistance){
      //console.log("distance > " + distance);
      t = Math.sqrt(this.pointDistance / distance);
      var cX = this.lastX + t*(this.currX - this.lastX);
      var cY = this.lastY + t*(this.currY - this.lastY);
      //console.log(distance2(lastX,lastY,cX,cY));
      this.createVertex(cX, cY);
    }
  };

  function findxy (res, e) {
    if (res == 'down') {
        self.prevX = self.currX;
        self.prevY = self.currY;
        self.currX = e.clientX - $('#2dcanvas').offset().left;//$('nav').width();//canvas2d.offsetLeft;//
        //currX = e.clientX - canvas2d.offset().left;
        self.currY = e.clientY - self.canvas2d.offsetTop;
        self.maxX = self.currX;
        self.minX = self.currX;
        self.maxY = self.currY;
        self.minY = self.currY;
        self.createVertex(self.currX,self.currY);

        self.flag = true;
        self.dot_flag = true;
        if (self.dot_flag) {

            self.ctx.beginPath();
            self.ctx.fillStyle = self.x;
            self.ctx.fillRect(self.currX, self.currY, 2, 2);
            self.ctx.closePath();

            self.dot_flag = false;
        }
    }
    if (res == 'up' || res == "out") {
      self.flag = false;
    }
    if (res == 'move') {
        if (self.flag) {
            self.prevX = self.currX;
            self.prevY = self.currY;
            self.currX = e.clientX - $('#2dcanvas').offset().left;//$('nav').width();//canvas2d.offsetLeft;//
            self.currY = e.clientY - self.canvas2d.offsetTop;
            console.log(e.clientX, self.currX, self.canvas2d.offsetTop);
            self.draw();
        }
    }
  };

  this.createVertex = function (valueX, valueY) {
    this.lastX = this.currX;
    this.lastY = this.currY;
    if (this.lastX > this.maxX) this.maxX = this.lastX;
    if (this.lastX < this.minX) this.minX = this.lastX;
    if (this.lastY > this.maxY) this.maxY = this.lastY;
    if (this.lastY < this.minY) this.minY = this.lastY;
    var style = this.ctx.fillStyle;
    this.ctx.fillStyle = "#02E020";
    this.ctx.beginPath();
    this.ctx.arc(valueX,valueY,2,0,2*Math.PI);
    this.ctx.fill();
    this.ctx.fillStyle = style;
    var point = [valueX,valueY];
    this.borderVertices.push(point);
    this.contour.push({x:valueX, y:valueY, id:(this.contour.length+1)});
  };

  function fillBorderBruteForce  (maxPointX,minPointX, maxPointY,minPointY , borderVertices) {
    console.log("Fill Border!!!", borderVertices);
    var odd = false;
    var fillPoints = [];
    for (var i = minPointX - self.pointDistance1; i < maxPointX; i+= self.pointDistance1) {
      var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#E0A000";
          self.ctx.beginPath();
          self.ctx.arc(i,minPointY-2*self.pointDistance1,2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
      for (var j = minPointY - self.pointDistance1; j < maxPointY; j+= self.pointDistance1) {
        odd = false;//test number os crossings with edge for the segment tha goes:
        var point = [i,j];//from the current point...
        var lastpoint = [i,minPointY-2*self.pointDistance1];//to the first one on self column.
        
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
          self.steiner.push({x: i, y: j, id: (self.steiner.length + 1)});
          var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#00F0A0";
          self.ctx.beginPath();
          self.ctx.arc(point[0],point[1],2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
        }
      }
    }
    console.log("Fill Points", fillPoints);
    return fillPoints;
  };

  function getMesh () {
    self.getDistanceVector();
    
    var swctx = new poly2tri.SweepContext(self.contour);
    swctx.addPoints(self.steiner);
    swctx.triangulate();
    triangles = swctx.getTriangles();
    triangles.forEach(function(t) {
      t.getPoints().forEach(function(p) {
          //console.log(p.id);
      });
      //console.log("X");
      //draw tri
      self.ctx.beginPath();
      self.ctx.moveTo(t.getPoint(0).x, t.getPoint(0).y);
      self.ctx.lineTo(t.getPoint(1).x, t.getPoint(1).y);
      self.ctx.lineTo(t.getPoint(2).x, t.getPoint(2).y);
      self.ctx.closePath();
      self.ctx.stroke();
    });
    
    self.debugInflate();
  };

  this.getDistanceVector = function () {
    console.log("Distancevector!");
    console.log("Is it here?",this.steiner, this.contour);
    this.arrayDistance = new Array(this.steiner.length);
    this.arrayDistance.fill(-1);

    //calculate the distance of every steiner point to all he segments on the border
    for (var j = 0; j < this.steiner.length; j++) {
        for (var i = 0; i < this.contour.length; i++) {
          var index = (i == (this.contour.length-1)) ? 0 : i+1;
          //console.log(i, index);
          var distance = pointToSegment(this.contour[i], this.contour[index], this.steiner[j]);
          //var distance = distance2(steiner[j].x, steiner[j].y, contour[i].x, contour[i].y)
          if (this.arrayDistance[j] == - 1 || this.arrayDistance[j] > distance) {
            this.arrayDistance[j] = distance;
          } 
        };
    };

    //for all pS: if arrayDistance[pS.id] < pointDistance: remove pS
    /**/
    this.steiner = this.steiner.filter( function (p) {
      if (self.arrayDistance[p.id - 1] >= self.pointDistance) {
       return true;
     } else {
      self.arrayDistance[p.id - 1] = -1;
      return false;
     }
    });

    this.arrayDistance = this.arrayDistance.filter( function (d) {
      return d != -1;
    });
    /**/

    var aD1 = this.arrayDistance.map (function (p) {
       return p;
    });
    console.log("ArrayDistance1:",aD1);
    
  };

  this.debugInflate = function () {
    var maxDistance = 0;
    var minDistance = -1;
    this.arrayDistance.map( function (d) {
      if (d > maxDistance) {
        maxDistance = d;
      };
      if (minDistance == -1 || minDistance > d) {
        minDistance = d;
      };
    });

    maxDistance = maxDistance - minDistance;

    var normalArrayDistance = this.arrayDistance.map( function (d) {
      return (d - minDistance) / maxDistance;
    });
    console.log(normalArrayDistance);
    var style = this.ctx.fillStyle;
    normalArrayDistance.map( function (d, i) {
      var value = parseInt(d*255);
      //console.log(value);
      self.ctx.beginPath();
      self.ctx.arc( self.steiner[i].x, self.steiner[i].y, self.pointDistance1/2.0, 0, 2*Math.PI);
      self.ctx.fillStyle = "rgb("+value+","+value+","+value+")";
      self.ctx.fill();
    } );
  };


}





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
};

function ccw (aX, aY, bX, bY, cX, cY) {
  return (cY-aY)*(bX-aX) > (bY-aY)*(cX-aX);
}

function intersect (aX, aY, bX, bY, cX, cY,dX, dY) {
  return ccw(aX, aY, cX, cY, dX, dY) !=
          ccw(bX, bY, cX, cY, dX, dY) && ccw(aX, aY, bX, bY, cX, cY) !=
          ccw(aX, aY, bX, bY, dX, dY);
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

