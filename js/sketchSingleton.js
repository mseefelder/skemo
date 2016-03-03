var sketch = function () {

  var self = this;
  var parent = null;

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
  this.proportion = {x: 0, y: 0};

  this.init2d = function (p, canvas) {
    parent = p;
    this.canvas2d = canvas;//document.getElementById('2dcanvas');
    this.ctx = this.canvas2d.getContext("2d");
    fullCanvas(this.canvas2d);
    this.w = this.canvas2d.width;
    this.h = this.canvas2d.height;

    this.ctx.clearRect(0, 0, this.w, this.h);
    self.borderPoints = [];
    self.contour = [];
    self.steiner = [];
    self.triangles = [];
    self.arrayDistance = null;
    self.borderVertices = [];
    //console.log("init", this.w, this.h);
  };

  this.mouseMoveHandle = function (e) {
    if(self.canvas2d.style.display != 'none') {
      findxy('move', e);
    }
  };

  this.mouseDownHandle = function (e) {
    if(self.canvas2d.style.display != 'none') {
      findxy('down', e);
    }
  };

  this.mouseUpHandle = function (e) {
    console.log(self.canvas2d.style.display);
    if(self.canvas2d.style.display != 'none') {
      findxy('up', e);
      fillBorderBruteForce(self.maxX, self.minX, self.maxY, self.minY, self.borderVertices);
      getMesh();
      self.proportion = {x: (self.maxX - self.minX)/self.w, y: (self.maxY - self.minY)/self.h};
    }
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

  this.getDistanceVector = function () {
    //console.log("Is it here?",this.steiner, this.contour);
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

    for (var i = 0; i < this.steiner.length; i++) {
      this.steiner[i].id = i+1+this.contour.length;
    };

    this.arrayDistance = this.arrayDistance.filter( function (d) {
      return d != -1;
    });
    /**/

    var aD1 = this.arrayDistance.map (function (p) {
       return p;
    });
    //console.log("ArrayDistance1:",aD1);
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
    //console.log(normalArrayDistance);
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
            //console.log(e.clientX, self.currX, self.canvas2d.offsetTop);
            self.draw();
        }
    }
  };

  function fillBorderBruteForce  (maxPointX,minPointX, maxPointY,minPointY , borderVertices) {
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

    return fillPoints;
  };

  function getMesh () {
    self.getDistanceVector();
    
    var swctx = new poly2tri.SweepContext(self.contour);
    swctx.addPoints(self.steiner);
    swctx.triangulate();
    self.triangles = swctx.getTriangles();
    self.triangles.forEach(function(t) {
      //console.log("Triangle: ");
      t.getPoints().forEach(function(p) {
          //console.log(p.x,p.y,p.id);
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

    //DEBUG START
    /**/
    var allPoints = new Array(self.contour.length+self.steiner.length);
    allPoints.fill(-1);
    self.triangles.forEach(function(t) {
      t.getPoints().forEach(function(p) {
          allPoints[p.id-1] = {x: p.x, y:p.y, id:p.id};
      });
    });
    //console.log("All Points:");
    for (var i = 0; i < allPoints.length; i++) {
      //console.log(allPoints[i].x, allPoints[i].y, allPoints[i].id);
    };
    //console.log("Contour");
    for (var i = 0; i < self.contour.length; i++) {
      //console.log(self.contour[i].x, self.contour[i].y, self.contour[i].id);
    };
    //console.log("Steiner");
    for (var i = 0; i < self.steiner.length; i++) {
      //console.log(self.steiner[i].x, self.steiner[i].y, self.steiner[i].id);
    };
    /**/
    //DEBUG END
    
    self.debugInflate();
  };
}

