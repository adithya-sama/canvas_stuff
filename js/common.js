function init_canvas(canvas){
    if(typeof(canvas) == 'string')
        canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvas));

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    return ctx;

}