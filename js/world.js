var world = new function() {
	var scene, camera, renderer, parent, plane, obj;
	var objects = new Array();
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2(); 
	var previousMousePosition = {x: 0, y:0};
	var size = { w: window.innerWidth, h:window.innerHeight};
	var self = this;
	this.isDragging = false;
	this.isRotating = false;
	this.canvas3d = null;
	var initialRotationVector = new THREE.Vector3();
	var finalRotationVector = new THREE.Vector3();
	var intersects = null;
	var cameraOffset = new THREE.Vector3(0,0,2);
	var translateOffset = new THREE.Vector3();
	var selected = {obj: null, p: null};
        this.proportion = {y : 0, w: 0, h: 0};

	this.init3d = function (p, canvas) {
		parent = p;
		this.canvas3d = canvas;

		fullCanvas(this.canvas3d);
	        this.canvas3d.width -= $('#3dcanvas').offset().left;
	    size = { w: this.canvas3d.width, h:this.canvas3d.height};

		scene = new THREE.Scene();
		obj = new THREE.Object3D;
		scene.add(obj);

		camera = new THREE.PerspectiveCamera( 75, this.canvas3d.width/this.canvas3d.height, 0.1, 1000 );

		renderer = new THREE.WebGLRenderer({canvas: this.canvas3d});
		renderer.setSize( this.canvas3d.width, this.canvas3d.height );

		camera.position.copy(cameraOffset);
		camera.lookAt(new THREE.Vector3(0,0,0));

		//create lighting
		var light1 = new THREE.PointLight( 0xffefef, 0.5, 100 );
		light1.position.set( 15, 15, 15 );
		scene.add( light1 );

		var light2 = new THREE.PointLight( 0xefefff, 0.5, 100 );
		light2.position.set( -15, 15, 15 );
		scene.add( light2 );

		//Plane used for translation
		plane =  new THREE.Mesh(new THREE.PlaneBufferGeometry(this.canvas3d.width, this.canvas3d.height,8,8), new THREE.MeshBasicMaterial({color: 0xff0000,
		 transparent: true, opacity: 0}));
		//plane =  new THREE.Mesh(new THREE.PlaneBufferGeometry(1.0, 1.0,8,8), new THREE.MeshBasicMaterial({color: 0xff0000,
		// transparent: true, opacity: 0.5}));
		scene.add(plane);
		plane.position.set(size.w,size.h,0);
        plane.visible = true;

        //control state variables
        self.isDragging = false;
		self.isRotating = false;

		render();	
	}

	this.buildObject = function (contour, steiner, arrayDistance, triangles) {
		//var material = new THREE.MeshDepthMaterial();
		//var material = new THREE.MeshBasicMaterial({ color: 0xdddddd, wireframe: true, side: THREE.DoubleSide});
		var material = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading, side: THREE.DoubleSide } );
		var geometry = new THREE.Geometry();

		//create common contour
		for (var i = 0; i < contour.length; i++) {
			geometry.vertices.push(
				new THREE.Vector3( contour[i].x,  contour[i].y, 0 )
			);
		};

		//create front vertices
		for (var i = 0; i < steiner.length; i++) {
			geometry.vertices.push(
				new THREE.Vector3( steiner[i].x,  steiner[i].y,arrayDistance[i].d )
			);
		};

		//create back vertices
		for (var i = 0; i < steiner.length; i++) {
			geometry.vertices.push(
				new THREE.Vector3( steiner[i].x,  steiner[i].y, -1.0*arrayDistance[i].d )
			);
		};

		//create faces
		var cl = contour.length;
		var sl = steiner.length;
		
		for (var i = 0; i < triangles.length; i++) {
			//create front faces
			geometry.faces.push( new THREE.Face3( triangles[i].getPoint(0).id-1, triangles[i].getPoint(1).id-1, triangles[i].getPoint(2).id-1 ) );

			//create back faces
			//var a = ((triangles[i].getPoint(0).id-1)>=cl)?(triangles[i].getPoint(0).id-1+sl):(triangles[i].getPoint(0).id-1);
			//var b = ((triangles[i].getPoint(1).id-1)>=cl)?(triangles[i].getPoint(1).id-1+sl):(triangles[i].getPoint(1).id-1);
			//var c = ((triangles[i].getPoint(2).id-1)>=cl)?(triangles[i].getPoint(2).id-1+sl):(triangles[i].getPoint(2).id-1);
			var a = ((triangles[i].getPoint(2).id-1)>=cl)?(triangles[i].getPoint(2).id-1+sl):(triangles[i].getPoint(2).id-1);
			var b = ((triangles[i].getPoint(1).id-1)>=cl)?(triangles[i].getPoint(1).id-1+sl):(triangles[i].getPoint(1).id-1);
			var c = ((triangles[i].getPoint(0).id-1)>=cl)?(triangles[i].getPoint(0).id-1+sl):(triangles[i].getPoint(0).id-1);

			geometry.faces.push( new THREE.Face3( a, b, c ) );
		};

		//Add sketches proportional to their size
        geometry.normalize();
        geometry.scale(self.proportion.y, -self.proportion.y, self.proportion.y);

        geometry = dumbSmoothGeometry(geometry);
        geometry = dumbSmoothGeometry(geometry);
        geometry = dumbSmoothGeometry(geometry);

        //dumbSmoothGeometry(geometry);
        //dumbSmoothGeometry(geometry);
        //dumbSmoothGeometry(geometry);

		geometry.verticesNeedUpdate = true;

		//So as to allow smooth shading
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		//Bounding sphere
		geometry.computeBoundingSphere();

		var object = new THREE.Mesh( geometry, material );
		
		objects.push(object);
	};

	var render = function () {
		requestAnimationFrame( render );

		if (objects) {
			for (var i = objects.length - 1; i >= 0; i--) {
				scene.add(objects[i]);
			}
		}

		//var axis = new THREE.Vector3(1,0,0);
		//scene.rotateOnAxis(axis, 0.01);
		//cameraOffset.normalize().applyAxisAngle(axis, 0.01).setLength(cameraOffset.length());
		//camera.up.applyAxisAngle(axis, 0.01);
		//camera.position.copy(cameraOffset);
		//camera.lookAt(new THREE.Vector3(0,0,0));
		//console.log("Camera: ", cameraOffset);
		
		renderer.render(scene, camera);
	};

	this.onMouseMove = function(e) {
		mouse.x = ((e.clientX - $('#3dcanvas').offset().left) / size.w) * 2 - 1;
		mouse.y = -((e.clientY - self.canvas3d.offsetTop) / size.h) * 2 + 1;
		var deltaMove = {x: e.clientX - previousMousePosition.x,
						 y: e.clientY - previousMousePosition.y};

		raycaster.setFromCamera(mouse,camera);

		if(self.isDragging) {
			// Intersect with plane
			var intersectPlane = raycaster.intersectObject(plane);
			// Based on offset calculated on onMouseDownTranslate, change object position
			selected.obj.position.copy(intersectPlane[0].point.sub(translateOffset));
		} else {
			//If not translating, keep updating plane to first hit object center, facing camera
			var intersects = raycaster.intersectObjects(objects);
			if (intersects.length > 0) {
				plane.position.copy(intersects[0].object.position);
				var at = new THREE.Vector3();
				//this three version implements a .lookAt that looks at a direction 
				//from the object's origin (o) to the parameter passed (p): p - o
				//so, we add the object's position (o) to make lookAt look at p
				at.copy(camera.position).add(plane.position);
				//var rot = new THREE.Matrix4();
				//rot.getInverse(rot.clone().makeRotationFromQuaternion(scene.quaternion.clone()));
				//at.applyMatrix4(rot);
				plane.lookAt(at);
			}
		}
		if(self.isRotating) {
			//trackball rotation
			finalRotationVector = projectOnSphere(mouse.x, mouse.y, 1.0);
			var dot = initialRotationVector.dot(finalRotationVector);
			var angle = ( dot <=1 ) ? Math.acos(dot) : 0.0;
			var axis = initialRotationVector.clone();
			axis.cross(finalRotationVector);
			if (axis.length() != 0) {
				axis.normalize();
			};
			axis.transformDirection(new THREE.Matrix4().getInverse(
				new THREE.Matrix4().multiplyMatrices(
					camera.matrixWorldInverse, scene.matrix
				)
			));
			//scene.rotateOnAxis(axis, 0.01);

			var offsetLength = cameraOffset.length();
			cameraOffset.normalize().applyAxisAngle(axis.negate(), angle).setLength(offsetLength);
			camera.position.copy(cameraOffset);
			camera.lookAt(new THREE.Vector3(0,0,0));

			initialRotationVector = finalRotationVector.clone();
		}
		previousMousePosition = { x: e.clientX, y: e.clientY};
	}

	this.onMouseDownTranslate = function(e) {
		raycaster.setFromCamera(mouse,camera);
		var intersection = raycaster.intersectObjects(objects);
		if (intersection.length > 0) {
			//{ distance, point, face, faceIndex, indices, object }
			selected.obj =  intersection[0].object;
			selected.p = intersection[0].point;

      		var intersectPlane = raycaster.intersectObject(plane);
			translateOffset.copy(intersectPlane[0].point).sub(plane.position);
	        self.isDragging = true;
		};
	}

	this.onMouseDownRotate = function(e) {
		initialRotationVector = projectOnSphere(mouse.x, mouse.y, 1.0);
		console.log("init Rot ", initialRotationVector);
		self.isRotating = true;
	}

	function projectOnSphere ( x, y, radius ) {
		var projection = new THREE.Vector3(x,y,0);
		var projectionLength = projection.length();
		if (projectionLength <= radius) {
			projection.z = Math.sqrt(1 - projectionLength);
			projection.normalize();
		} else{
			projection.normalize();
		}
		return projection;
	}

	this.onMouseUp =  function(e) {
        self.isDragging = false;
        self.isRotating = false;
    }

    this.onDelete =  function(e) {
    	raycaster.setFromCamera(mouse,camera);
		var intersec_delete = raycaster.intersectObjects(objects);
		if(intersec_delete.length > 0) {
			//console.log(intersec_delete);
			for(var i = 0; i < objects.length; i++ ){
				if(intersec_delete[0].object.id == objects[i].id){
					//console.log('entrei');
					objects.splice(i,1);
					scene.remove(intersec_delete[0].object);
				}
			}
			//console.log(objects);
			render();
		}
    }


	function toRadians (degrees) {
        return degrees * (Math.PI/180);
      }

    function dumbSmoothGeometry (geom) {
    	var smoothing = new Array(geom.vertices.length);
    	/**/
    	var weights = new Array(geom.vertices.length);
    	for (var i = 0; i < smoothing.length; i++) {
    		smoothing[i] = geom.vertices[i].clone();
    		weights[i] = 1.0;
    	};

    	var tri = 0;
    	for (var i = 0; i < geom.faces.length; i++) {
    		tri = geom.faces[i].clone();

    		smoothing[tri.a].add(geom.vertices[tri.b]).add(geom.vertices[tri.c]);
    		smoothing[tri.b].add(geom.vertices[tri.a]).add(geom.vertices[tri.c]);
    		smoothing[tri.c].add(geom.vertices[tri.a]).add(geom.vertices[tri.b]);

    		weights[tri.a] += 2.0;
    		weights[tri.b] += 2.0;
    		weights[tri.c] += 2.0;
    	};

    	for (var i = 0; i < smoothing.length; i++) {
    		//console.log(weights[i], " & ", smoothing[i]);
    		smoothing[i] = smoothing[i].divideScalar(weights[i]);
    		geom.vertices[i] = smoothing[i].clone();
    	};

    	return geom;
		/**/
		/**
		for (var i = 0; i < geom.vertices.length; i++) {
			smoothing[i] = geom.vertices[i].clone();
		};



		for (var i = 0; i < smoothing.length; i++) {
    		geom.vertices[i] = smoothing[i].clone();
    	};

    	return geom;
    	/**/
    }

    function catmullClarkSubdiv (geom) {
    	//face points
    	var faceP = new Array(geom.faces.length);

		var tri = 0;
    	for (var i = 0; i < geom.faces.length; i++) {
    		tri = geom.faces[i].clone();
    		faceP[i] = geom.vertices[tri.a]
    			.clone()
    			.add(geom.vertices[tri.b])
    			.add(geom.vertices[tri.c])
    			.divideScalar(3.0);

    	};    	
    }

}
