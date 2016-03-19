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
        document.addEventListener("mouseup",function( event ){
          sketchToMesh(event, sketch1); 
        } , false);
        //document.addEventListener("mouseup", sketch1.mouseUpHandle, false);
        document.addEventListener("mouseout", sketch1.mouseOutHandle, false);
        //canvas3d.addEventListener("mouseout", sketch1.mouseOutHandle, false);
    };

    //Function to be called on sketching mouseup to create mesh
    function sketchToMesh (e,sketch) {
        try{
            sketch.mouseUpHandle(e);
        } catch (err) {
            alert("Invalid sketch.");
        }

        if(world.canvas3d.style.display == 'none') {
            if(sketch.proportion.y) {
        	   world.proportion = {y: sketch.proportion.y, h:sketch.h, w: sketch.w};
            }
            world.buildObject(sketch.contour, sketch.steiner, sketch.arrayDistance, sketch.triangles);
            displaying = sketch.canvas2d.style.display;
            sketch.canvas2d.style.display = "none";
            world.canvas3d.style.display = "block";
        }
    };
}

$(document).ready(function () {
    main.init();
    var canvas2d = document.getElementById('2dcanvas');
    var canvas3d = document.getElementById('3dcanvas');

    $('#edit').on('click', function() {
        document.removeEventListener('mousemove', world.onMouseMove, false);
        document.removeEventListener('mousedown',world.onMouseDown,false);
        document.removeEventListener('mouseup',world.onMouseUp,false);
        document.removeEventListener('click', world.onDelete, false);
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

    $('#translate').on('click', function() {
        world.isRotating = false;
        var canvas2d = document.getElementById('2dcanvas');
        var canvas3d = document.getElementById('3dcanvas');
        canvas2d.style.display == 'none';
        canvas3d.style.display = 'block';
        document.addEventListener('mousemove', world.onMouseMove, false);

        document.removeEventListener('mousedown',world.onMouseDownRotate,false);
        document.addEventListener('mousedown',world.onMouseDownTranslate,false);
        document.addEventListener('mouseup',world.onMouseUp,false);
        document.removeEventListener('click', world.onDelete, false);


    });

    $('#rotate').on('click', function() {
        world.isTranslating = false;
        var canvas2d = document.getElementById('2dcanvas');
        var canvas3d = document.getElementById('3dcanvas');
        canvas2d.style.display == 'none';
        canvas3d.style.display = 'block';
        document.addEventListener('mousemove', world.onMouseMove, false);

        document.removeEventListener('mousedown', world.onMouseDownTranslate, false);
        document.addEventListener('mousedown',world.onMouseDownRotate,false);
        document.addEventListener('mouseup',world.onMouseUp,false);
        document.removeEventListener('click', world.onDelete, false);


    });

    $('#delete').on('click', function(){
        document.addEventListener('mousemove', world.onMouseMove, false);
        document.removeEventListener('mousedown',world.onMouseDown,false);
        document.removeEventListener('mouseup',world.onMouseUp,false);
        document.addEventListener('click', world.onDelete, false);
    });
})
