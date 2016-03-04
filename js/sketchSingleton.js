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
  this.pointDistance = 100;
  this.pointDistance1 = Math.sqrt(self.pointDistance);
  //mesh points.
  this.borderPoints = [];
  this.contour = [];
  this.steiner = [];
  this.triangles = [];
  this.x = "black";
  this.y = 2;
  this.proportion = {x: 0, y: 0};

  this.init2d = function (p, canvas) {
    parent = p;
    self.canvas2d = canvas;//document.getElementById('2dcanvas');
    self.ctx = self.canvas2d.getContext("2d");
    fullCanvas(self.canvas2d);
    self.w = self.canvas2d.width;
    self.h = self.canvas2d.height;

    self.ctx.clearRect(0, 0, self.w, self.h);
    self.borderPoints = [];
    self.contour = [];
    self.steiner = [];
    self.triangles = [];
    self.arrayDistance = null;
    self.borderVertices = [];
    self.arrayDistance = null;
    self.arrayMaxima = [];
    //console.log("init", self.w, self.h);
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
    if(self.canvas2d.style.display != 'none') {
      findxy('up', e);
      fillBorderHex(self.maxX, self.minX, self.maxY, self.minY, self.borderVertices);
      getMesh();
      self.proportion = {x: (self.maxX - self.minX)/self.w, y: (self.maxY - self.minY)/self.h};
    }
  };

  this.mouseOutHandle = function (e) {
      findxy('out', e);
  };

  this.draw = function () {
    self.ctx.strokeStyle = "red";
    self.ctx.lineWidth = 1;
    self.ctx.beginPath();
    self.ctx.moveTo(self.prevX, self.prevY);
    self.ctx.lineTo(self.currX, self.currY);
    self.ctx.stroke();
    self.ctx.closePath();
    self.ctx.strokeStyle = self.x;
    self.ctx.lineWidth = self.y;
    var distance = distance2(self.lastX, self.lastY, self.currX, self.currY);

    if (distance == self.pointDistance ) {
      //console.log("distance = " + distance);
      self.createVertex(self.currX,self.currY);
    }else if(distance > self.pointDistance){
      //console.log("distance > " + distance);
      t = Math.sqrt(self.pointDistance / distance);
      var cX = self.lastX + t*(self.currX - self.lastX);
      var cY = self.lastY + t*(self.currY - self.lastY);
      //console.log(distance2(lastX,lastY,cX,cY));
      self.createVertex(cX, cY);
    }
  };

  this.createVertex = function (valueX, valueY) {
    self.lastX = self.currX;
    self.lastY = self.currY;
    if (self.lastX > self.maxX) self.maxX = self.lastX;
    if (self.lastX < self.minX) self.minX = self.lastX;
    if (self.lastY > self.maxY) self.maxY = self.lastY;
    if (self.lastY < self.minY) self.minY = self.lastY;
    var style = self.ctx.fillStyle;
    self.ctx.fillStyle = "#02E020";
    self.ctx.beginPath();
    self.ctx.arc(valueX,valueY,2,0,2*Math.PI);
    self.ctx.fill();
    self.ctx.fillStyle = style;
    var point = [valueX,valueY];
    self.borderVertices.push(point);
    self.contour.push({x:valueX, y:valueY, id:(self.contour.length+1)});
  };

  this.getDistanceVectorHopeSmooth = function () {
    console.log("Is it here?",self.steiner, self.contour);
    self.arrayDistance = new Array(self.steiner.length);


    //calculate the distance of every steiner point to all the segments on the border
    for (var j = 0; j < self.steiner.length; j++) {
        self.arrayDistance[j] = {d: -1, v: {x:-1, y:-1}};
        for (var i = 0; i < self.contour.length; i++) {
          var index = (i == (self.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(self.contour[i], self.contour[index], self.steiner[j]);
          if (self.arrayDistance[j].d == - 1 || self.arrayDistance[j].d > distance.d) {
            self.arrayDistance[j].d = distance.d;
            self.arrayDistance[j].v = distance.vector;
          } 
        };
    };

    console.log("DISTANCES", self.arrayDistance);

    //for all pS: if arrayDistance[pS.id] < pointDistance: remove pS
    self.steiner = self.steiner.filter( function (point) {
      if (self.arrayDistance[point.id - 1].d >= (self.pointDistance/4.0)) {
       return true;
     } else {
      self.arrayDistance[point.id - 1].d = -1;
      return false;
     }
    });

    //re-index steiner points
    for (var i = 0; i < self.steiner.length; i++) {
      self.steiner[i].id = i+1+self.contour.length;
    };

    //remove distances belonging to removed steiner points
    self.arrayDistance = self.arrayDistance.filter( function (element) {
      return element.d != -1;
    });

    //take the root of all distances
    self.arrayDistance = self.arrayDistance.map( function (element) {
      return {d: Math.sqrt(element.d), v: element.v};
    } );

    console.log("DISTANCES", self.arrayDistance);

    /**/

    for (var j = 0; j < self.steiner.length; j++) {
        for (var i = 0; i < self.contour.length; i++) {
          var index = (i == (self.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(self.contour[i], self.contour[index], self.steiner[j]);
          if (Math.abs(self.arrayDistance[j].d-Math.sqrt(distance.d)) <= 1.0*(Number.EPSILON+self.pointDistance1)) {
            if (dot(self.arrayDistance[j].v.x, self.arrayDistance[j].v.y, distance.vector.x, distance.vector.y)<0.0) {
              self.arrayMaxima.push(j);
              break;
            };
          } 
        };
    };

    console.log("DISTANCES", self.arrayDistance);
    console.log("MAXIMA", self.arrayMaxima);
    /**/

    //Smooth each maximum with its neighbouring maximum (that lie inside its radius of distance)
    var smoothHeight = new Array(self.arrayMaxima.length);
    //var tempRadius = 0;
    var accumWeight = 0;
    var tempWeight = 0;
    var tempDist = 0;
    for (var i = 0; i < self.arrayMaxima.length; i++) {
      
      //self height has weight 1
      accumWeight = 1.0;
      smoothHeight[i] = 1.0*self.arrayDistance[self.arrayMaxima[i]].d;
      //set up radius with margin of error
      //tempRadius = (self.arrayDistance[self.arrayMaxima[i]].d+Number.EPSILON+self.pointDistance1);
      //check neighbours
      for (var j = 0; j < self.arrayMaxima.length; j++) {
        console.log("j", j);
        tempDist = distance1(self.steiner[self.arrayMaxima[i]].x, self.steiner[self.arrayMaxima[i]].y, self.steiner[self.arrayMaxima[j]].x, self.steiner[self.arrayMaxima[j]].y);
        if(i != j && tempDist < self.arrayDistance[self.arrayMaxima[i]].d ) {//tempRadius ) {
          tempWeight = (Math.sqrt((self.arrayDistance[self.arrayMaxima[i]].d*self.arrayDistance[self.arrayMaxima[i]].d)-(tempDist*tempDist)))/self.arrayDistance[self.arrayMaxima[i]].d;
          accumWeight += tempWeight;
          smoothHeight[i] += tempWeight*self.arrayDistance[self.arrayMaxima[j]].d;
        }

      };

      smoothHeight[i] = smoothHeight[i]/accumWeight;

    };

    console.log("DISTANCES", self.arrayDistance);
    console.log("smoothHeight", smoothHeight);
    /**/

    var smoothAll = new Array(self.arrayDistance);
    var weightAll = new Array(self.arrayDistance);
    for (var i = 0; i < self.arrayDistance.length; i++) {
      smoothAll[i] = self.arrayDistance[i].d;
      weightAll[i] = 1.0;
    }

    //Now, replace maxima distances on arrayDistance by smoothed distances
    for (var i = self.arrayMaxima.length - 1; i >= 0; i--) {
      //console.log(self.arrayDistance[self.arrayMaxima[i]].d,"-->",smoothHeight[i])
      self.arrayDistance[self.arrayMaxima[i]].d = smoothHeight[i];

      for (var j = 0; j < self.arrayDistance.length; j++) {
        var distance = distance2(self.steiner[j].x, self.steiner[j].y, self.steiner[self.arrayMaxima[i]].x, self.steiner[self.arrayMaxima[i]].y);
        if (j != self.arrayMaxima[i] && distance < (self.arrayDistance[self.arrayMaxima[i]].d*self.arrayDistance[self.arrayMaxima[i]].d) ) {

          if (self.arrayDistance[j].d < self.arrayDistance[self.arrayMaxima[i]].d) {
            smoothAll[j] += Math.sqrt((2.0*self.arrayDistance[self.arrayMaxima[i]].d*self.arrayDistance[j].d)-(self.arrayDistance[j].d*self.arrayDistance[j].d));
            weightAll[j] += 1.0;
          } else{
            smoothAll[j] += self.arrayDistance[self.arrayMaxima[i]].d;
            weightAll[j] += 1.0;
          };

        }
      };
      
    };

    console.log("DISTANCES", self.arrayDistance);
    console.log("smoothAll", smoothAll);
    console.log("weightAll", weightAll);
    /**/

    //inflation smoothing
    for (var i = 0; i < self.arrayDistance.length; i++) {
      self.arrayDistance[i].d = smoothAll[i]/weightAll[i];
      if (Number.isNaN(self.arrayDistance[i].d)) {
        self.arrayDistance[i].d = 0.0;
      };
    };

    console.log("DISTANCES", self.arrayDistance);
    /**/

  };

  self.debugInflate = function () {
    var maxDistance = 0;
    var minDistance = -1;
    self.arrayDistance.map( function (d) {
      if (d.d > maxDistance) {
        maxDistance = d.d;
      };
      if (minDistance == -1 || minDistance > d.d) {
        minDistance = d.d;
      };
    });

    maxDistance = maxDistance - minDistance;

    var normalArrayDistance = self.arrayDistance.map( function (d) {
      return (d.d - minDistance) / maxDistance;
    });
    //console.log(normalArrayDistance);
    var style = self.ctx.fillStyle;
    normalArrayDistance.map( function (d, i) {
      var value = parseInt(d*255);
      //console.log(value);
      self.ctx.beginPath();
      self.ctx.arc( self.steiner[i].x, self.steiner[i].y, self.pointDistance1/2.0, 0, 2*Math.PI);
      //self.ctx.arc( self.steiner[i].x, self.steiner[i].y, 2.0, 0, 2*Math.PI);
      self.ctx.fillStyle = "rgb("+value+","+value+","+value+")";
      self.ctx.fill();
    } );

    for (var i = 0; i < self.arrayMaxima.length; i++) {
      var style = self.ctx.fillStyle;
      self.ctx.fillStyle = "#FF00FF";
      self.ctx.beginPath();
      self.ctx.arc(self.steiner[self.arrayMaxima[i]].x,self.steiner[self.arrayMaxima[i]].y,6,0,2*Math.PI);
      self.ctx.fill();
      self.ctx.fillStyle = style;
    };
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
        }
      }
    }

    return fillPoints;
  };

  function fillBorderHex  (maxPointX,minPointX, maxPointY,minPointY , borderVertices) {

    smoothContour();

    var odd = false;
    var fillPoints = [];
    var upMove = Math.sqrt(3)*self.pointDistance1;
    for (var i = minPointX - self.pointDistance1; i < maxPointX; i+= self.pointDistance1) {
      var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#E0A000";
          self.ctx.beginPath();
          self.ctx.arc(i,minPointY-2*self.pointDistance1,2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
      for (var j = minPointY - self.pointDistance1; j < maxPointY; j+= upMove) {
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
        }
      }
    }
    for (var i = minPointX - (self.pointDistance1/2.0); i < maxPointX; i+= self.pointDistance1) {
      var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#E0A000";
          self.ctx.beginPath();
          self.ctx.arc(i,minPointY-2*self.pointDistance1,2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
      for (var j = minPointY - self.pointDistance1 + (upMove/2.0); j < maxPointY; j+= upMove) {
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
        }
      }
    }

    return fillPoints;
  };

  function smoothContour() {
    var smoothContour = new Array(self.contour.length);
    var next = 0;
    var prev = 0;
    for (var i = 0; i < self.contour.length; i++) {
      next = (i == (self.contour.length-1)) ? 0 : i+1;
      prev = (i == 0) ? (self.contour.length-1) : i-1;
      smoothContour[i] = (self.contour[i]+self.contour[next]+self.contour[prev])/3.0;
    };
  }

  function smoothSteiner() {
    //smooth mesh with neighbour structures
    var smoothSteiner = new Array(self.steiner);
    var weightSteiner = new Array(self.steiner);
    for (var i = 0; i < self.arrayDistance.length; i++) {
      smoothSteiner[i] = self.arrayDistance[i].d;
      weightSteiner[i] = 1.0;
    };

    var cl = self.contour.length;
    var sl = self.steiner.length;

    for (var i = 0; i < self.triangles.length; i++) {
      var verts = self.triangles[i].getPoints();
      if (verts[0].id > cl) {
        smoothSteiner[verts[0].id-cl-1] += (verts[1].id > cl) ? self.arrayDistance[verts[1].id-cl-1].d : 0.0;
        smoothSteiner[verts[0].id-cl-1] += (verts[2].id > cl) ? self.arrayDistance[verts[2].id-cl-1].d : 0.0;
        weightSteiner[verts[0].id-cl-1] += 2.0;
      };
      if (verts[1].id > cl) {
        smoothSteiner[verts[1].id-cl-1] += (verts[0].id > cl) ? self.arrayDistance[verts[0].id-cl-1].d : 0.0;
        smoothSteiner[verts[1].id-cl-1] += (verts[2].id > cl) ? self.arrayDistance[verts[2].id-cl-1].d : 0.0;
        weightSteiner[verts[1].id-cl-1] += 2.0;
      };
      if (verts[2].id > cl) {
        smoothSteiner[verts[2].id-cl-1] += (verts[1].id > cl) ? self.arrayDistance[verts[1].id-cl-1].d : 0.0;
        smoothSteiner[verts[2].id-cl-1] += (verts[0].id > cl) ? self.arrayDistance[verts[0].id-cl-1].d : 0.0;
        weightSteiner[verts[2].id-cl-1] += 2.0;
      };
    };

    for (var i = 0; i < self.arrayDistance.length; i++) {
      self.arrayDistance[i].d = smoothSteiner[i]/weightSteiner[i];
      if (Number.isNaN(self.arrayDistance[i].d)) {
        self.arrayDistance[i].d = 0.0;
      };
    };

    //console.log("arrayDistance: ", self.arrayDistance)
    //console.log(smoothSteiner, weightSteiner);
  };

  function smoothMesh() {
    //smooth mesh with neighbour structures
    var smoothSteiner = new Array(self.steiner);
    var weightSteiner = new Array(self.steiner);
    for (var i = 0; i < self.arrayDistance.length; i++) {
      smoothSteiner[i] = self.arrayDistance[i].d;
      weightSteiner[i] = 1.0;
    };

    var smoothContour = new Array(self.contour.length);
    var weightContour = new Array(self.contour.length);
    for (var i = 0; i < self.contour.length; i++) {
      smoothContour[i] = {x: self.contour[i].x, y: self.contour[i].y};
      weightContour[i] = 1.0;
    };

    var cl = self.contour.length;
    var sl = self.steiner.length;

    for (var i = 0; i < self.triangles.length; i++) {
      var verts = self.triangles[i].getPoints();
      if (verts[0].id > cl) {
        smoothSteiner[verts[0].id-cl-1] += (verts[1].id > cl) ? self.arrayDistance[verts[1].id-cl-1].d : 0.0;
        smoothSteiner[verts[0].id-cl-1] += (verts[2].id > cl) ? self.arrayDistance[verts[2].id-cl-1].d : 0.0;
        weightSteiner[verts[0].id-cl-1] += 2.0;
      } else {
        smoothContour[verts[0].id-1].x += (verts[1].id > cl) ? self.steiner[verts[1].id-cl-1].x : self.contour[verts[1].id-1].x;
        smoothContour[verts[0].id-1].y += (verts[1].id > cl) ? self.steiner[verts[1].id-cl-1].y : self.contour[verts[1].id-1].y;
        smoothContour[verts[0].id-1].x += (verts[2].id > cl) ? self.steiner[verts[2].id-cl-1].x : self.contour[verts[2].id-1].x;
        smoothContour[verts[0].id-1].y += (verts[2].id > cl) ? self.steiner[verts[2].id-cl-1].y : self.contour[verts[2].id-1].y;
        weightContour += 2.0;
      };
      if (verts[1].id > cl) {
        smoothSteiner[verts[1].id-cl-1] += (verts[0].id > cl) ? self.arrayDistance[verts[0].id-cl-1].d : 0.0;
        smoothSteiner[verts[1].id-cl-1] += (verts[2].id > cl) ? self.arrayDistance[verts[2].id-cl-1].d : 0.0;
        weightSteiner[verts[1].id-cl-1] += 2.0;
      } else {
        smoothContour[verts[1].id-1].x += (verts[0].id > cl) ? self.steiner[verts[0].id-cl-1].x : self.contour[verts[0].id-1].x;
        smoothContour[verts[1].id-1].y += (verts[0].id > cl) ? self.steiner[verts[0].id-cl-1].y : self.contour[verts[0].id-1].y;
        smoothContour[verts[1].id-1].x += (verts[2].id > cl) ? self.steiner[verts[2].id-cl-1].x : self.contour[verts[2].id-1].x;
        smoothContour[verts[1].id-1].y += (verts[2].id > cl) ? self.steiner[verts[2].id-cl-1].y : self.contour[verts[2].id-1].y;
        weightContour += 2.0;
      };
      if (verts[2].id > cl) {
        smoothSteiner[verts[2].id-cl-1] += (verts[1].id > cl) ? self.arrayDistance[verts[1].id-cl-1].d : 0.0;
        smoothSteiner[verts[2].id-cl-1] += (verts[0].id > cl) ? self.arrayDistance[verts[0].id-cl-1].d : 0.0;
        weightSteiner[verts[2].id-cl-1] += 2.0;

      } else {
        smoothContour[verts[2].id-1].x += (verts[0].id > cl) ? self.steiner[verts[0].id-cl-1].x : self.contour[verts[0].id-1].x;
        smoothContour[verts[2].id-1].y += (verts[0].id > cl) ? self.steiner[verts[0].id-cl-1].y : self.contour[verts[0].id-1].y;
        smoothContour[verts[2].id-1].x += (verts[1].id > cl) ? self.steiner[verts[1].id-cl-1].x : self.contour[verts[1].id-1].x;
        smoothContour[verts[2].id-1].y += (verts[1].id > cl) ? self.steiner[verts[1].id-cl-1].y : self.contour[verts[1].id-1].y;
        weightContour += 2.0;
      };
    };

    for (var i = 0; i < self.arrayDistance.length; i++) {
      self.arrayDistance[i].d = smoothSteiner[i]/weightSteiner[i];
      if (Number.isNaN(self.arrayDistance[i].d)) {
        self.arrayDistance[i].d = 0.0;
      };
    };

    for (var i = 0; i < self.contour.length; i++) {
      var tempX = self.contour[i].x;
      var tempY = self.contour[i].y;
      self.contour[i].x = smoothContour[i].x/weightContour[i];
      self.contour[i].y = smoothContour[i].y/weightContour[i];
      if (Number.isNaN(self.contour[i].x) || !Number.isFinite(self.contour[i].x)) {
        if (Number.isNaN(tempX) || !Number.isFinite(tempY)) {
          self.contour[i].x = 0.0;
        } else {
          self.contour[i].x = tempX;
        }
      };
      if (Number.isNaN(self.contour[i].y) || !Number.isFinite(self.contour[i].y)) {
        if (Number.isNaN(tempY) || !Number.isFinite(tempY)) {
          self.contour[i].y = 0.0;
        } else {
          self.contour[i].y = tempY;
        }
      };
    };
  };

  function getMesh () {
    self.getDistanceVectorHopeSmooth();

    
    var swctx = new poly2tri.SweepContext(self.contour);
    swctx.addPoints(self.steiner);
    swctx.triangulate();
    self.triangles = swctx.getTriangles();

    smoothSteiner();
    smoothContour();
    smoothSteiner();
    smoothContour();
    smoothSteiner();
    smoothContour();

  };
}

