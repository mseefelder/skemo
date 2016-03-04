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
  this.pointDistance1 = Math.sqrt(this.pointDistance);
  //mesh points.
  this.borderPoints = [];
  this.contour = [];
  this.steiner = [];
  this.triangles = [];
  this.arrayDistance = null;
  this.arrayMaxima = [];
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

    console.log("DISTANCES", this.arrayDistance);

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

    console.log("DISTANCES", this.arrayDistance);
    /**/

    var aD1 = this.arrayDistance.map (function (p) {
       return p;
    });
    //console.log("ArrayDistance1:",aD1);
  };

  //after this function is called:
  //steiner points closest than pointDistance1/2.0 are eliminated
  //the height of each steiner point s is in this.arrayDistance[s].d
  this.getDistanceVectorRecode = function () {
    //create array with the right size:
    this.arrayDistance = new Array(this.steiner.length);

    var nextJ = 0; //used in the loop below to store next j index (to create segments)
    var tempDist = 0; //used to store temporary distance values
    //calculate the distance of every steiner point to all he segments on the border
    for (var i = 0; i < this.steiner.length; i++) {
        this.arrayDistance[i] = {d: -1, v: {x:-1, y:-1}};
        for (var j = 0; j < this.contour.length; j++) {
          nextJ = (j == (this.contour.length-1)) ? 0 : j+1;
          tempDist = pointToSegmentHope(this.contour[j], this.contour[nextJ], this.steiner[i]);
          if (this.arrayDistance[i].d == - 1 || this.arrayDistance[i].d > tempDist.d) {
            this.arrayDistance[i].d = tempDist.d;
            this.arrayDistance[i].v = tempDist.vector;
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);

    //now, arrayDistance is filled with the squared distance of each steiner point to its closest
    //border.

    //Next step is cleaning up steiner points too close to the border (bad points):
    this.steiner = this.steiner.filter( function (point) {
      if (self.arrayDistance[point.id - 1].d >= (self.pointDistance1/2.0)) {
       return true;
     } else {
      //Elements that don't exist anymore get their distances changed to -1
      self.arrayDistance[point.id - 1].d = -1;
      return false;
     }
    });

    //Now the steiner array is clean of bad points, but the .id values are wrong
    for (var i = this.steiner.length - 1; i >= 0; i--) {
      this.steiner[i].id = i+1+this.contour.length; //the .id is added to contour.length
                                                    //because it will be used on triangulation
    };

    //Now the .id values are corrected.
    //Next, we need to remove the elements tha don't belong to arrayDistance anymore
    this.arrayDistance = this.arrayDistance.filter( function (element) {
      return element.d != -1;
    });

    //now we take the square root of all distances
    this.arrayDistance = this.arrayDistance.map( function (element) {
      return {d: Math.sqrt(element.d), v: element.v};
    } );

    //So, we have all the distances from each steiner point to its closest bored on .d elements
    //of arrayDistance
    console.log("DISTANCES", this.arrayDistance);

    //Let's find the local maxima
    this.arrayMaxima = [];
    //we'll reuse the temporary variables created before:
    nextJ = 0; //used in the loop below to store next j index (to create segments)
    tempDist = 0; //used to store temporary distance values

    for (var i = 0; i < this.steiner.length; i++) {
        for (var j = 0; j < this.contour.length; j++) {
          nextJ = (j == (this.contour.length-1)) ? 0 : j+1;
          tempDist = pointToSegmentHope(this.contour[j], this.contour[nextJ], this.steiner[i]);
          if (Math.abs(this.arrayDistance[i].d-Math.sqrt(tempDist.d)) <= 1.0*(Number.EPSILON+this.pointDistance1)) {
            if (dot(this.arrayDistance[i].v.x, this.arrayDistance[i].v.y, tempDist.vector.x, tempDist.vector.y)<0.0) {
              this.arrayMaxima.push(i);
              break;
            };
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);

    //draw all maxima
    for (var i = 0; i < this.arrayMaxima.length; i++) {
      var style = self.ctx.fillStyle;
      self.ctx.fillStyle = "#FF00FF";
      self.ctx.beginPath();
      self.ctx.arc(this.steiner[this.arrayMaxima[i]].x,this.steiner[this.arrayMaxima[i]].y,6,0,2*Math.PI);
      self.ctx.fill();
      self.ctx.fillStyle = style;
    };

    var min = 0;
    //var tempDist = 0; //declared above
    var tempProj = 0;
    //for each steiner point
    for (var i = 0; i < this.arrayDistance.length; i++) {
      //check if it isn't one of the local maxima
      //if (bSearch(this.arrayMaxima, i)) continue;
      if (this.arrayMaxima.includes(i)) continue;
      //Now, we're going to find the local maximum closest to the point
      //set a starting value for the distance and to wich index it refers
      min = {dist: distance2(this.steiner[i].x, this.steiner[i].y, this.steiner[this.arrayMaxima[0]].x, this.steiner[this.arrayMaxima[0]].y),
                  proj: Math.abs(normalizedProjectionLength(
                        this.steiner[i].x-this.steiner[this.arrayMaxima[0]].x,
                        this.steiner[i].y-this.steiner[this.arrayMaxima[0]].y,
                        this.arrayDistance[i].v.x,
                        this.arrayDistance[i].v.y)),
                  ind: 0};
      tempDist = 0;
      tempProj = 0;
      //Check distance to all maxima, storing the smallest
      for (var j = 1; j < this.arrayMaxima.length; j++) {
        //distance between point and the maximum
        tempDist = distance2(this.steiner[i].x, this.steiner[i].y, this.steiner[this.arrayMaxima[j]].x, this.steiner[this.arrayMaxima[j]].y);
        //similarity between vector to maximum and vector to border, the greater the better
        tempProj = Math.abs(normalizedProjectionLength(
          this.steiner[i].x-this.steiner[this.arrayMaxima[j]].x,
          this.steiner[i].y-this.steiner[this.arrayMaxima[j]].y,
          this.arrayDistance[i].v.x,
          this.arrayDistance[i].v.y));
        //if the new maximum is closer than the best (considering an error margin) and the similarity between vector is higher...
        //if ((tempDist < min.dist+Number.EPSILON+this.pointDistance1) && (tempProj >= min.proj)) { //REMEMBER, THE DISTS ARE SQUARED
        if (tempDist < min.dist) {
          min.dist = tempDist;
          min.proj = tempProj;
          min.ind = this.arrayMaxima[j];
        };
      };

      //draw connection:
      var style = this.ctx.strokeStyle;
      this.ctx.strokeStyle = "#01FA03";
      this.ctx.beginPath();
      this.ctx.moveTo(this.steiner[i].x, this.steiner[i].y);
      this.ctx.lineTo(this.steiner[min.ind].x, this.steiner[min.ind].y);
      this.ctx.stroke();
      this.ctx.strokeStyle = style;

      //based on the point's vector to the border, the local maximum and the distances, calculate inflation amount:
      this.arrayDistance[i].d = Math.sqrt(this.arrayDistance[min.ind]*this.arrayDistance[min.ind].d-min.dist);
      //var projectedLength = normalizedProjectionLength((this.arrayDistance[i]), (), this.arrayDistance[min.ind].v.x, this.arrayDistance[min.ind].v.y);
      //this.arrayDistance[i].d = Math.abs(this.arrayDistance[min.ind].d-min.dist);
    };




  };


  this.getDistanceVectorHope = function () {
    console.log("Is it here?",this.steiner, this.contour);
    this.arrayDistance = new Array(this.steiner.length);


    //calculate the distance of every steiner point to all the segments on the border
    for (var j = 0; j < this.steiner.length; j++) {
        this.arrayDistance[j] = {d: -1, v: {x:-1, y:-1}};
        for (var i = 0; i < this.contour.length; i++) {
          var index = (i == (this.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(this.contour[i], this.contour[index], this.steiner[j]);
          if (this.arrayDistance[j].d == - 1 || this.arrayDistance[j].d > distance.d) {
            this.arrayDistance[j].d = distance.d;
            this.arrayDistance[j].v = distance.vector;
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);

    //for all pS: if arrayDistance[pS.id] < pointDistance: remove pS
    this.steiner = this.steiner.filter( function (point) {
      if (self.arrayDistance[point.id - 1].d >= (self.pointDistance/4.0)) {
       return true;
     } else {
      self.arrayDistance[point.id - 1].d = -1;
      return false;
     }
    });

    //re-index steiner points
    for (var i = 0; i < this.steiner.length; i++) {
      this.steiner[i].id = i+1+this.contour.length;
    };

    //remove distances belonging to removed steiner points
    this.arrayDistance = this.arrayDistance.filter( function (element) {
      return element.d != -1;
    });

    //take the root of all distances
    this.arrayDistance = this.arrayDistance.map( function (element) {
      return {d: Math.sqrt(element.d), v: element.v};
    } );

    console.log("DISTANCES", this.arrayDistance);

    for (var j = 0; j < this.steiner.length; j++) {
        for (var i = 0; i < this.contour.length; i++) {
          var index = (i == (this.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(this.contour[i], this.contour[index], this.steiner[j]);
          if (Math.abs(this.arrayDistance[j].d-Math.sqrt(distance.d)) <= 1.0*(Number.EPSILON+this.pointDistance1)) {
            if (dot(this.arrayDistance[j].v.x, this.arrayDistance[j].v.y, distance.vector.x, distance.vector.y)<0.0) {
              this.arrayMaxima.push(j);
              break;
            };
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);

    //Smooth each maximum with its neighbouring maximum (that lie inside its radius of distance)
    var smoothHeight = new Array(this.arrayMaxima.length);
    //var tempRadius = 0;
    var accumWeight = 0;
    var tempWeight = 0;
    var tempDist = 0;
    for (var i = 0; i < this.arrayMaxima.length; i++) {
      
      //self height has weight 1
      accumWeight = 1.0;
      smoothHeight[i] = 1.0*this.arrayDistance[this.arrayMaxima[i]].d;
      //set up radius with margin of error
      //tempRadius = (this.arrayDistance[this.arrayMaxima[i]].d+Number.EPSILON+this.pointDistance1);
      //check neighbours
      for (var j = 0; j < this.arrayMaxima.length; j++) {
        
        tempDist = distance1(this.steiner[this.arrayMaxima[i]].x, this.steiner[this.arrayMaxima[i]].y, this.steiner[this.arrayMaxima[j]].x, this.steiner[this.arrayMaxima[j]].y);
        if(i != j && tempDist < this.arrayDistance[this.arrayMaxima[i]].d ) {//tempRadius ) {
          tempWeight = (Math.sqrt((this.arrayDistance[this.arrayMaxima[i]].d*this.arrayDistance[this.arrayMaxima[i]].d)-(tempDist*tempDist)))/this.arrayDistance[this.arrayMaxima[i]].d;
          accumWeight += tempWeight;
          smoothHeight[i] += tempWeight*this.arrayDistance[this.arrayMaxima[j]].d;
        }

      };

      smoothHeight[i] = smoothHeight[i]/accumWeight;

    };

    console.log("DISTANCES", this.arrayDistance);

    //Now, replace maxima distances on arrayDistance by smoothed distances
    for (var i = this.arrayMaxima.length - 1; i >= 0; i--) {
      //console.log(this.arrayDistance[this.arrayMaxima[i]].d,"-->",smoothHeight[i])
      this.arrayDistance[this.arrayMaxima[i]].d = smoothHeight[i];

    };

    console.log("DISTANCES", this.arrayDistance);

    var min = 0;
    var min2 = 0;
    tempDist = 0; //declared above
    var tempProj = 0;
    //for each steiner point
    for (var i = 0; i < this.arrayDistance.length; i++) {
      //check if it isn't one of the local maxima
      //if (bSearch(this.arrayMaxima, i)) continue;
      if (this.arrayMaxima.includes(i)) continue;
      //Now, we're going to find the local maximum closest to the point
      //set a starting value for the distance and to wich index it refers
      min = {dist: distance2(this.steiner[i].x, this.steiner[i].y, this.steiner[this.arrayMaxima[0]].x, this.steiner[this.arrayMaxima[0]].y),
                  proj: Math.abs(normalizedProjectionLength(
                        this.steiner[i].x-this.steiner[this.arrayMaxima[0]].x,
                        this.steiner[i].y-this.steiner[this.arrayMaxima[0]].y,
                        this.arrayDistance[i].v.x,
                        this.arrayDistance[i].v.y)),
                  ind: this.arrayMaxima[0]};
      min2 = {dist: distance2(this.steiner[i].x, this.steiner[i].y, this.steiner[this.arrayMaxima[0]].x, this.steiner[this.arrayMaxima[0]].y),
                  proj: Math.abs(normalizedProjectionLength(
                        this.steiner[i].x-this.steiner[this.arrayMaxima[0]].x,
                        this.steiner[i].y-this.steiner[this.arrayMaxima[0]].y,
                        this.arrayDistance[i].v.x,
                        this.arrayDistance[i].v.y)),
                  ind: this.arrayMaxima[0]};
      tempDist = 0;
      tempProj = 0;
      //Check distance to all maxima, storing the smallest
      for (var j = 1; j < this.arrayMaxima.length; j++) {
        //distance between point and the maximum
        tempDist = distance2(this.steiner[i].x, this.steiner[i].y, this.steiner[this.arrayMaxima[j]].x, this.steiner[this.arrayMaxima[j]].y);
        //similarity between vector to maximum and vector to border, the greater the better
        tempProj = Math.abs(normalizedProjectionLength(
          this.steiner[i].x-this.steiner[this.arrayMaxima[j]].x,
          this.steiner[i].y-this.steiner[this.arrayMaxima[j]].y,
          this.arrayDistance[i].v.x,
          this.arrayDistance[i].v.y));
        //if the new maximum is closer than the best (considering an error margin) and the similarity between vector is higher...
        //if ((tempDist < min.dist+Number.EPSILON+this.pointDistance1) && (tempProj >= min.proj)) { //REMEMBER, THE DISTS ARE SQUARED
        if (tempDist < min.dist) {
          min2.dist = min.dist;
          min2.proj = min.proj;
          min2.ind = min.ind;
          min.dist = tempDist;
          min.proj = tempProj;
          min.ind = this.arrayMaxima[j];
        } else if (tempDist < min2.dist) {
          min2.dist = tempDist;
          min2.proj = tempProj;
          min2.ind = this.arrayMaxima[j];
        };
      };

      //6 nearest-neighbour smoothing


      //console.log("CONNECT", i, "-->", min.ind, " & ", min2.ind);

      //draw connection:
      var style = this.ctx.strokeStyle;
      this.ctx.strokeStyle = "#01FA03";
      this.ctx.beginPath();
      this.ctx.moveTo(this.steiner[i].x, this.steiner[i].y);
      this.ctx.lineTo(this.steiner[min.ind].x, this.steiner[min.ind].y);
      this.ctx.stroke();
      this.ctx.strokeStyle = style;

      //based on the point's local maximum and the distances, calculate inflation amount:
      /**
      this.arrayDistance[i].d = Math.sqrt( Math.max( ((this.arrayDistance[min.ind].d*this.arrayDistance[min.ind].d)-min.dist), 0.0 ) );
      this.arrayDistance[i].d += Math.sqrt( Math.max( ((this.arrayDistance[min2.ind].d*this.arrayDistance[min2.ind].d)-min2.dist), 0.0 ) );
      this.arrayDistance[i].d = this.arrayDistance[i].d/2.0;
      /**/
      /**
      this.arrayDistance[i].d = Math.sqrt( Math.max( ((this.arrayDistance[min.ind].d*this.arrayDistance[min.ind].d)-min.dist), 0.0 ) );
      this.arrayDistance[i].d += Math.sqrt( Math.max( ((this.arrayDistance[min2.ind].d*this.arrayDistance[min2.ind].d)-min2.dist), 0.0 ) );
      this.arrayDistance[i].d = this.arrayDistance[i].d/2.0;
      /**/
      /**/
      if (this.arrayDistance[i].d < this.arrayDistance[min.ind].d) {
        this.arrayDistance[i].d = Math.sqrt((2.0*this.arrayDistance[min.ind].d*this.arrayDistance[i].d)-(this.arrayDistance[i].d*this.arrayDistance[i].d));
      } else{
        this.arrayDistance[i].d = this.arrayDistance[min.ind].d;
      };
      if (this.arrayDistance[i].d < this.arrayDistance[min.ind].d) {
        this.arrayDistance[i].d += Math.sqrt((2.0*this.arrayDistance[min2.ind].d*this.arrayDistance[i].d)-(this.arrayDistance[i].d*this.arrayDistance[i].d));
      } else{
        this.arrayDistance[i].d += this.arrayDistance[min2.ind].d;
      };
      this.arrayDistance[i].d = this.arrayDistance[i].d/2.0;
      /**/
    };

    console.log("DISTANCES", this.arrayDistance);

  };

  this.getDistanceVectorHopeSmooth = function () {
    console.log("Is it here?",this.steiner, this.contour);
    this.arrayDistance = new Array(this.steiner.length);


    //calculate the distance of every steiner point to all the segments on the border
    for (var j = 0; j < this.steiner.length; j++) {
        this.arrayDistance[j] = {d: -1, v: {x:-1, y:-1}};
        for (var i = 0; i < this.contour.length; i++) {
          var index = (i == (this.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(this.contour[i], this.contour[index], this.steiner[j]);
          if (this.arrayDistance[j].d == - 1 || this.arrayDistance[j].d > distance.d) {
            this.arrayDistance[j].d = distance.d;
            this.arrayDistance[j].v = distance.vector;
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);

    //for all pS: if arrayDistance[pS.id] < pointDistance: remove pS
    this.steiner = this.steiner.filter( function (point) {
      if (self.arrayDistance[point.id - 1].d >= (self.pointDistance/4.0)) {
       return true;
     } else {
      self.arrayDistance[point.id - 1].d = -1;
      return false;
     }
    });

    //re-index steiner points
    for (var i = 0; i < this.steiner.length; i++) {
      this.steiner[i].id = i+1+this.contour.length;
    };

    //remove distances belonging to removed steiner points
    this.arrayDistance = this.arrayDistance.filter( function (element) {
      return element.d != -1;
    });

    //take the root of all distances
    this.arrayDistance = this.arrayDistance.map( function (element) {
      return {d: Math.sqrt(element.d), v: element.v};
    } );

    console.log("DISTANCES", this.arrayDistance);

    /**/

    for (var j = 0; j < this.steiner.length; j++) {
        for (var i = 0; i < this.contour.length; i++) {
          var index = (i == (this.contour.length-1)) ? 0 : i+1;
          var distance = pointToSegmentHope(this.contour[i], this.contour[index], this.steiner[j]);
          if (Math.abs(this.arrayDistance[j].d-Math.sqrt(distance.d)) <= 1.0*(Number.EPSILON+this.pointDistance1)) {
            if (dot(this.arrayDistance[j].v.x, this.arrayDistance[j].v.y, distance.vector.x, distance.vector.y)<0.0) {
              this.arrayMaxima.push(j);
              break;
            };
          } 
        };
    };

    console.log("DISTANCES", this.arrayDistance);
    console.log("MAXIMA", this.arrayMaxima);
    /**/

    //Smooth each maximum with its neighbouring maximum (that lie inside its radius of distance)
    var smoothHeight = new Array(this.arrayMaxima.length);
    //var tempRadius = 0;
    var accumWeight = 0;
    var tempWeight = 0;
    var tempDist = 0;
    for (var i = 0; i < this.arrayMaxima.length; i++) {
      
      //self height has weight 1
      accumWeight = 1.0;
      smoothHeight[i] = 1.0*this.arrayDistance[this.arrayMaxima[i]].d;
      //set up radius with margin of error
      //tempRadius = (this.arrayDistance[this.arrayMaxima[i]].d+Number.EPSILON+this.pointDistance1);
      //check neighbours
      for (var j = 0; j < this.arrayMaxima.length; j++) {
        
        tempDist = distance1(this.steiner[this.arrayMaxima[i]].x, this.steiner[this.arrayMaxima[i]].y, this.steiner[this.arrayMaxima[j]].x, this.steiner[this.arrayMaxima[j]].y);
        if(i != j && tempDist < this.arrayDistance[this.arrayMaxima[i]].d ) {//tempRadius ) {
          tempWeight = (Math.sqrt((this.arrayDistance[this.arrayMaxima[i]].d*this.arrayDistance[this.arrayMaxima[i]].d)-(tempDist*tempDist)))/this.arrayDistance[this.arrayMaxima[i]].d;
          accumWeight += tempWeight;
          smoothHeight[i] += tempWeight*this.arrayDistance[this.arrayMaxima[j]].d;
        }

      };

      smoothHeight[i] = smoothHeight[i]/accumWeight;

    };

    console.log("DISTANCES", this.arrayDistance);
    console.log("smoothHeight", smoothHeight);
    /**/

    var smoothAll = new Array(this.arrayDistance);
    var weightAll = new Array(this.arrayDistance);
    for (var i = 0; i < self.arrayDistance.length; i++) {
      smoothAll[i] = self.arrayDistance[i].d;
      weightAll[i] = 1.0;
    }

    //Now, replace maxima distances on arrayDistance by smoothed distances
    for (var i = this.arrayMaxima.length - 1; i >= 0; i--) {
      //console.log(this.arrayDistance[this.arrayMaxima[i]].d,"-->",smoothHeight[i])
      this.arrayDistance[this.arrayMaxima[i]].d = smoothHeight[i];

      for (var j = 0; j < this.arrayDistance.length; j++) {
        var distance = distance2(this.steiner[j].x, this.steiner[j].y, this.steiner[this.arrayMaxima[i]].x, this.steiner[this.arrayMaxima[i]].y);
        if (j != this.arrayMaxima[i] && distance < (this.arrayDistance[this.arrayMaxima[i]].d*this.arrayDistance[this.arrayMaxima[i]].d) ) {

          if (this.arrayDistance[j].d < this.arrayDistance[this.arrayMaxima[i]].d) {
            smoothAll[j] += Math.sqrt((2.0*this.arrayDistance[this.arrayMaxima[i]].d*this.arrayDistance[j].d)-(this.arrayDistance[j].d*this.arrayDistance[j].d));
            weightAll[j] += 1.0;
          } else{
            smoothAll[j] += this.arrayDistance[this.arrayMaxima[i]].d;
            weightAll[j] += 1.0;
          };

        }
      };
      
    };

    console.log("DISTANCES", this.arrayDistance);
    console.log("smoothAll", smoothAll);
    console.log("weightAll", weightAll);
    /**/

    //inflation smoothing
    for (var i = 0; i < this.arrayDistance.length; i++) {
      self.arrayDistance[i].d = smoothAll[i]/weightAll[i];
      if (Number.isNaN(self.arrayDistance[i].d)) {
        self.arrayDistance[i].d = 0.0;
      };
    };

    console.log("DISTANCES", this.arrayDistance);
    /**/

  };

  this.debugInflate = function () {
    var maxDistance = 0;
    var minDistance = -1;
    this.arrayDistance.map( function (d) {
      if (d.d > maxDistance) {
        maxDistance = d.d;
      };
      if (minDistance == -1 || minDistance > d.d) {
        minDistance = d.d;
      };
    });

    maxDistance = maxDistance - minDistance;

    var normalArrayDistance = this.arrayDistance.map( function (d) {
      return (d.d - minDistance) / maxDistance;
    });
    //console.log(normalArrayDistance);
    var style = this.ctx.fillStyle;
    normalArrayDistance.map( function (d, i) {
      var value = parseInt(d*255);
      //console.log(value);
      self.ctx.beginPath();
      self.ctx.arc( self.steiner[i].x, self.steiner[i].y, self.pointDistance1/2.0, 0, 2*Math.PI);
      //self.ctx.arc( self.steiner[i].x, self.steiner[i].y, 2.0, 0, 2*Math.PI);
      self.ctx.fillStyle = "rgb("+value+","+value+","+value+")";
      self.ctx.fill();
    } );

    for (var i = 0; i < this.arrayMaxima.length; i++) {
      var style = self.ctx.fillStyle;
      self.ctx.fillStyle = "#FF00FF";
      self.ctx.beginPath();
      self.ctx.arc(this.steiner[this.arrayMaxima[i]].x,this.steiner[this.arrayMaxima[i]].y,6,0,2*Math.PI);
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
          /*
          var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#00F0A0";
          self.ctx.beginPath();
          self.ctx.arc(point[0],point[1],2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
          */
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
          /*
          var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#00F0A0";
          self.ctx.beginPath();
          self.ctx.arc(point[0],point[1],2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
          */
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
          /*
          var style = self.ctx.fillStyle;
          self.ctx.fillStyle = "#00F0A0";
          self.ctx.beginPath();
          self.ctx.arc(point[0],point[1],2,0,2*Math.PI);
          self.ctx.fill();
          self.ctx.fillStyle = style;
          */
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
    var smoothSteiner = new Array(this.steiner);
    var weightSteiner = new Array(this.steiner);
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
    var smoothSteiner = new Array(this.steiner);
    var weightSteiner = new Array(this.steiner);
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
      self.contour[i].x = smoothContour[i].x/weightContour[i];
      self.contour[i].y = smoothContour[i].y/weightContour[i];
      if (Number.isNaN(self.contour[i].x)) {
        self.contour[i].x = 0.0;
      };
      if (Number.isNaN(self.contour[i].y)) {
        self.contour[i].y = 0.0;
      };
    };

    //console.log("arrayDistance: ", self.arrayDistance)
    //console.log(smoothSteiner, weightSteiner);
  };

  function getMesh () {
    //self.getDistanceVector();
    //self.getDistanceVectorHope();
    self.getDistanceVectorHopeSmooth();
    //self.getDistanceVectorRecode();

    
    var swctx = new poly2tri.SweepContext(self.contour);
    swctx.addPoints(self.steiner);
    swctx.triangulate();
    self.triangles = swctx.getTriangles();

    smoothSteiner();
    //smoothMesh();
    smoothSteiner();
    //smoothMesh();

    //DEBUG START
    /**/
    self.triangles.forEach(function(t) {
      /**
      console.log("Triangle: ");
      t.getPoints().forEach(function(p) {
          //console.log(p.x,p.y,p.id);
      });
      /**
      self.ctx.beginPath();
      self.ctx.moveTo(t.getPoint(0).x, t.getPoint(0).y);
      self.ctx.lineTo(t.getPoint(1).x, t.getPoint(1).y);
      self.ctx.lineTo(t.getPoint(2).x, t.getPoint(2).y);
      self.ctx.closePath();
      self.ctx.stroke();
      /**/
    });
    /**/

    /**
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

