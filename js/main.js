var main = new function () {

    var self = this;
    var displaying;

    this.init = function () {
        var canvas2d = document.getElementById('2dcanvas');
        var canvas3d = document.getElementById('3dcanvas');

        sketch.init2d(self, canvas2d);
        world.init3d(self, canvas3d);

        world.canvas3d.style.visibility = "hidden";

        document.addEventListener("mousemove", sketch.mouseMoveHandle, false);
        document.addEventListener("mousedown", sketch.mouseDownHandle, false);
        document.addEventListener("mouseup", sketch.mouseUpHandle, false);
        //document.addEventListener("mouseup", sketchToMesh, false);
        document.addEventListener("mouseout", sketch.mouseOutHandle, false);
    };

    //Function to be called on sketching mouseup to create mesh
    function sketchToMesh (e) {
        sketch.mouseUpHandle(e);
        world.buildObject(sketch.contour, sketch.steiner, sketch.arrayDistance, sketch.triangles);
        displaying = sketch.canvas2d.style.display;
        sketch.canvas2d.style.display = "none";
        world.canvas3d.style.visibility = "visible";
    };
}