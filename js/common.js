function init_canvas(canvas, on_resize){
    if(typeof(canvas) == 'string')
        canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvas));

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if(on_resize)
            on_resize();
    });
    
    return ctx;

}

function darken_color(rgb, step = 1, return_rgb) {
    step = Math.min(Math.max(0, step), 100);
    for (let i = 0; i < 3; i++) {
        return_rgb[i] = rgb[i] - ((rgb[i] / 100) * step);
    }
}
