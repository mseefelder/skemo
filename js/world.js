var world = new function() {
	var scene, camera, renderer, cube;
	var self = this;

	this.init3d = function () {
		var canvas3d = document.getElementById('3dcanvas');
		fullCanvas(canvas3d);
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, canvas3d.width/canvas3d.height, 0.1, 1000 );

		renderer = new THREE.WebGLRenderer({canvas: canvas3d});
		renderer.setSize( canvas3d.width, canvas3d.height );

		var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
		cube = new THREE.Mesh( geometry, material );
		scene.add( cube );

		camera.position.z = 5;

		render();	
	}

	var render = function () {
		requestAnimationFrame( render );

		cube.rotation.x += 0.1;
		cube.rotation.y += 0.1;

		renderer.render(scene, camera);
	};

}