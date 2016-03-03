var main = new function () {

    var self = this;
    var displaying;
    var sketch1 = new sketch();

    this.init = function () {
        
        var canvas2d = document.getElementById('2dcanvas');
        var canvas3d = document.getElementById('3dcanvas');
        
        sketch1.init2d(self, canvas2d);
        world.init3d(self, canvas3d);

        canvas3d.style.display = "none";

        document.addEventListener("mousemove", sketch1.mouseMoveHandle, false);
        document.addEventListener("mousedown", sketch1.mouseDownHandle, false);
        //document.addEventListener("mouseup", sketch.mouseUpHandle, false);
        document.addEventListener("mouseup",function(){
          sketchToMesh(event, sketch1); 
        } , false);
        canvas3d.addEventListener("mouseout", sketch1.mouseOutHandle, false);
    };

    //Function to be called on sketching mouseup to create mesh
    function sketchToMesh (e,sketch) {
        sketch.mouseUpHandle(e);
        world.buildObject(sketch.contour, sketch.steiner, sketch.arrayDistance, sketch.triangles);
        displaying = sketch.canvas2d.style.display;
        sketch.canvas2d.style.display = "none";
        world.canvas3d.style.display = "block";
    };
}

$(document).ready(function () {
    main.init();
    var canvas2d = document.getElementById('2dcanvas');
    var canvas3d = document.getElementById('3dcanvas');

    $('#edit').on('click', function() {
        if(canvas2d.style.display == "none") {
            canvas2d.style.display = 'block';
            canvas3d.style.display = 'none';

            var sketch1 =  new sketch();
            sketch1.init2d(self, canvas2d);
            main.init(sketch);
        } else {
            canvas3d.style.display = 'block';
            canvas2d.style.display = "none"; 
        }
    });
})