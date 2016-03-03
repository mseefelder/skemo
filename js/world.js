var world = new function() {
	var scene, camera, renderer, object, parent;
	var self = this;

	this.canvas3d = null;

	this.init3d = function (p, canvas) {
		parent = p;
		this.canvas3d = canvas;//document.getElementById('3dcanvas');
		fullCanvas(this.canvas3d);
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

		render();	
	}

	this.buildObject = function (contour, steiner, arrayDistance, triangles) {
		var material = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading, side: THREE.DoubleSide, wireframe: false } );
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
				new THREE.Vector3( steiner[i].x,  steiner[i].y, arrayDistance[i].d )//Math.sqrt(arrayDistance[i].d) )
			);
		};

		//create back vertices
		for (var i = 0; i < steiner.length; i++) {
			//console.log(steiner[i].x,  steiner[i].y, arrayDistance[i]);
			geometry.vertices.push(
				new THREE.Vector3( steiner[i].x,  steiner[i].y, -1.0*arrayDistance[i].d )//-1.0*Math.sqrt(arrayDistance[i].d) )
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
		geometry.normalize();
		
		//console.log("Normalized");
		//for (var i = 0; i < geometry.vertices.length; i++) {
		//	console.log(geometry.vertices[i]);
		//};

		//correct 
		geometry.scale(1.0,-1.0,1.0);
		
		//So as to allow smooth shading
		geometry.computeVertexNormals();

		//Dunno
		geometry.computeBoundingSphere();

		object = new THREE.Mesh( geometry, material );
		scene.add( object );

	};

	var render = function () {
		requestAnimationFrame( render );

		if (object) {
			object.rotation.y += 0.005;
		}
			
		//cube.rotation.x += 0.1;
		//cube.rotation.y += 0.1;

		renderer.render(scene, camera);
	};

}