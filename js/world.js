var world = new function() {
	var scene, camera, renderer, parent, plane;
	var objects = new Array();
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2(); 
	var previousMousePosition = {x: 0, y:0};
	var size = { w: window.innerWidth, h:window.innerHeight};
	var self = this;
	this.isDragging = false;
	this.canvas3d = null;
	var intersects = null;
	var offset = new THREE.Vector3();
	var selected = {obj: null, p: null};
        this.proportion = {y : 0, w: 0, h: 0};
	this.init3d = function (p, canvas) {
		parent = p;
		this.canvas3d = canvas;//document.getElementById('3dcanvas');
		fullCanvas(this.canvas3d);
	        console.log(this.canvas3d.width);
	        this.canvas3d.width -= $('#3dcanvas').offset().left;
	        console.log(this.canvas3d.width);
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, this.canvas3d.width/this.canvas3d.height, 0.1, 1000 );
		//camera = new THREE.OrthographicCamera( this.canvas3d.width / - 2, this.canvas3d.width / 2, this.canvas3d.height / 2, this.canvas3d.height / - 2, 1, 1000 );

		renderer = new THREE.WebGLRenderer({canvas: this.canvas3d});
		renderer.setSize( this.canvas3d.width, this.canvas3d.height );

		camera.position.x = 0;
		camera.position.y = 0;
		camera.position.z = 2;

		//create lighting
		var light1 = new THREE.PointLight( 0xffefef, 1, 100 );
		light1.position.set( 15, 15, 15 );
		scene.add( light1 );

		var light2 = new THREE.PointLight( 0xefefff, 1, 100 );
		light2.position.set( -15, 15, 15 );
		scene.add( light2 );

		plane =  new THREE.Mesh(new THREE.PlaneBufferGeometry(this.canvas3d.width, this.canvas3d.height,8,8), new THREE.MeshBasicMaterial({color: 0xffffff,
		 transparent: true, opacity: 0}));
		scene.add(plane);
		plane.position.set(size.w,size.h,0);
        plane.visible = true;

		render();	
	}

	this.buildObject = function (contour, steiner, arrayDistance, triangles) {
		var material = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading, side: THREE.DoubleSide } );
		var geometry = new THREE.Geometry();

		//create common contour
		//console.log("Vertices:");
		for (var i = 0; i < contour.length; i++) {
			//console.log(contour[i].x,  contour[i].y, 0);
			geometry.vertices.push(
				new THREE.Vector3( contour[i].x,  contour[i].y, 0 )
			);
		};

		//create front vertices
		for (var i = 0; i < steiner.length; i++) {
			//console.log(steiner[i].x,  steiner[i].y, arrayDistance[i]);
			geometry.vertices.push(
				new THREE.Vector3( steiner[i].x,  steiner[i].y,arrayDistance[i].d )
			);
		};

		//create back vertices
		for (var i = 0; i < steiner.length; i++) {
			//console.log(steiner[i].x,  steiner[i].y, arrayDistance[i]);
			geometry.vertices.push(
				new THREE.Vector3( steiner[i].x,  steiner[i].y, -1.0*arrayDistance[i].d )
			);
		};

		//console.log("Faces");
		var cl = contour.length;
		var sl = steiner.length;
		
		for (var i = 0; i < triangles.length; i++) {
			//console.log(triangles[i].getPoint(0).id, triangles[i].getPoint(1).id, triangles[i].getPoint(2).id);
			//create front faces
			geometry.faces.push( new THREE.Face3( triangles[i].getPoint(0).id-1, triangles[i].getPoint(1).id-1, triangles[i].getPoint(2).id-1 ) );

			//create back faces
			var a = ((triangles[i].getPoint(0).id-1)>=cl)?(triangles[i].getPoint(0).id-1+sl):(triangles[i].getPoint(0).id-1);
			var b = ((triangles[i].getPoint(1).id-1)>=cl)?(triangles[i].getPoint(1).id-1+sl):(triangles[i].getPoint(1).id-1);
			var c = ((triangles[i].getPoint(2).id-1)>=cl)?(triangles[i].getPoint(2).id-1+sl):(triangles[i].getPoint(2).id-1);
			//console.log(a, b, c);
			geometry.faces.push( new THREE.Face3( a, b, c ) );
		};

		//To set model in [-1,1] sphere
	        //geometry.normalize();
	        var rad = 75.0 * Math.PI/180;
	        var width_scene  = 2 * ((1.0/Math.abs(Math.tan(rad/2.0)))+ 0.1)/(1.0/Math.abs(Math.tan(rad/2.0)));
	        console.log(width_scene, Math.tan(rad/2.0));
	        /*var scale_y = self.proportion.y * width_scene;*/
	        var scale_y =  width_scene/self.proportion.h;
	        geometry.translate(- self.proportion.w/2.0, -self.proportion.h/2.0, 0);
			geometry.scale(scale_y, -scale_y, scale_y);
		//geometry.normalize();
	        //console.log("Normalized");
		//for (var i = 0; i < geometry.vertices.length; i++) {
		//	console.log(geometry.vertices[i]);
		//};

		//correct 
		//geometry.scale(1.0,-1.0,1.0);
		
		//So as to allow smooth shading
		geometry.computeVertexNormals();

		//Dunno
		geometry.computeBoundingSphere();

		var object = new THREE.Mesh( geometry, material );
		
		//scene.add( object );
		objects.push(object);

	};

	var smoothGeometry

	var render = function () {
		requestAnimationFrame( render );


		if (objects) {
			for (var i = objects.length - 1; i >= 0; i--) {
				//objects[i].rotation.y += 0.05;
				scene.add(objects[i]);
			}
			//object.rotation.y = 0.05;
		}
			
		//cube.rotation.x += 0.1;
		//cube.rotation.y += 0.1;
		

		renderer.render(scene, camera);
	};

	this.onMouseMove = function(e) {
		mouse.x = ((e.clientX - $('#3dcanvas').offset().left) / size.w) * 2 - 1;
		mouse.y = -((e.clientY - self.canvas3d.offsetTop) / size.h) * 2 + 1;
		var deltaMove = {x: e.clientX - previousMousePosition.x,
						 y: e.clientY - previousMousePosition.y};
		if(self.isDragging) {
			raycaster.setFromCamera(mouse,camera);
			var intersect = raycaster.intersectObject(plane);
			var translateVector = new THREE.Vector3();
			translateVector.subVectors(intersect[0].point, selected.p);
			selected.obj.translateX(translateVector.x).translateY(translateVector.y).translateZ(translateVector.z);
			selected.p = intersect[0].point;
			console.log(translateVector,intersect[0].point, selected.p);
		}
		if(!self.isDragging) {
			var deltaRotationQuaternion =  new THREE.Quaternion()
			.setFromEuler(new THREE.Euler(
				toRadians(deltaMove.y * 1),
				toRadians(deltaMove.x * 1),
				0,
				'XYZ'
				));
			var object = intersects[0];
        object.quaternion.multiplyQuaternions(deltaRotationQuaternion, object.quaternion);
		}
		previousMousePosition = { x: event.clientX, y: event.clientY};
	}

	this.onMouseDown = function(e) {
		console.log('entrei');

		raycaster.setFromCamera(mouse,camera);
		var abelha = raycaster.intersectObjects(objects);
		//{ distance, point, face, faceIndex, indices, object }
		selected.obj =  abelha[0].object;
		selected.p = abelha[0].point;

		console.log( abelha, selected.obj, camera, mouse);
		
		var vector =  new THREE.Vector3(0,0,20);
		plane.position.copy(selected.p);
		plane.lookAt(plane.position.x, plane.position.y, 100);
        self.isDragging = true;
	}

	this.onMouseUp =  function(e) {
        self.isDragging = false;
      }

	function toRadians (degrees) {
        return degrees * (Math.PI/180);
      }

}
