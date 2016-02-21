function init() {
    sketch.init2d();
    world.init3d();

    document.addEventListener("mousemove", sketch.mouseMoveHandle, false);
    document.addEventListener("mousedown", sketch.mouseDownHandle, false);
    document.addEventListener("mouseup", sketch.mouseUpHandle, false);
    document.addEventListener("mouseout", sketch.mouseOutHandle, false);
}