
function get_timestamp(){
    return (new Date()).getTime();
}

function arr2rgba(arr){
    return `rgb(${arr[0]}, ${arr[1]}, ${arr[2]}, ${arr[3]})`;
}

function fade_color(rgba, step = 1, return_rgb) {
    div_by = 100;
    step = Math.min(Math.max(0, step), div_by);
    return_rgb[3] = rgba[3] - ((rgba[3] / div_by) * step);
}

function degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}

function add_vec(x, y, x2, y2){
    return [x + x2, y + y2];
}

function rotate_vector(point, deg) {
    if(deg == 0) return;
    deg = degrees_to_radians(deg);
    let cos = Math.cos(deg);
    let sin = Math.sin(deg);
    [point.x, point.y] = [(cos * point.x) - (sin * point.y), (cos * point.y) + (sin * point.x)];
    return point;
}

function mul_vec(v, m) {
    v.x *= m;
    v.y *= m; 
    return v;
}

function add_vec(a, b) {
    a.x += b.x;
    a.y += b.y;
    return a;
}

function great_waves(canvas_id, wave_init_speed = 1){
    
    let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvas_id));

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    let mouse_pos = {
        "x": 0,
        "y": 0,
        "vx": 0,
        "vy": 0,
        "vm": 0
    };
    
    let old_mouse_pos = {
        "x": 0,
        "y": 0
    }

    wave_init_speed = Math.pow(wave_init_speed, 2);

    canvas.onmousemove = (e) => {
        [mouse_pos.x, mouse_pos.y] = [event.x, event.y];
        mouse_pos.vx = mouse_pos.x - old_mouse_pos.x;
        mouse_pos.vy = mouse_pos.y - old_mouse_pos.y;
        mouse_pos.vm = Math.pow(mouse_pos.vx, 2) + Math.pow(mouse_pos.vy, 2);
        //make_wave(e);
        [old_mouse_pos.x, old_mouse_pos.y] = [mouse_pos.x, mouse_pos.y];
    }

    let first = true;

    function make_wave(event){
        if (!first && mouse_pos.vm > wave_init_speed) {
            waves.push();
        }
        first = false;
    }

    let waves = [];

    function update_waves(){
        for(let i=0; waves[i] != undefined; i++){
            waves[i].draw();
            if(waves[i].deleted){
                waves.splice(i, 1);
            }
        }
    }

    class Wave{

        constructor(
            ctx,
            origin,
            length,
            initial_rotation = 0,
            rotation_speed = 0,
            wave_speed = 1,
            wave_direction = 1,
            wave_thickness = 0.8
        ){
            this.origin = origin;
            this.l = length;
            this.current_rotation = initial_rotation * wave_direction;
            this.rotation_speed = rotation_speed * wave_direction;
            this.wave_speed = wave_speed;
            this.wave_direction = wave_direction;
            this.wave_thickness = wave_thickness;
            this.ctx = ctx;
            this.curve_points = [];
            this.init();
            this.deleted = false;
            this.counter = 0;
            this.max_iterations = 50 / this.wave_speed;
        }

        init() {

            let half_base_vector = {
                x: 0,
                y: -this.l / 2
            }

            //curve 1 point 0
            this.curve_points.push({
                x: 0,
                y: 0,
                real: { x: 0, y: 0 },
            });

            //curve 1 point 1
            this.curve_points.push({
                local_origin: add_vec(
                    { ...half_base_vector },
                    { x: this.l * this.wave_direction * 0.075, y: this.l * 0.1 }
                ),
                base: rotate_vector({ ...half_base_vector }, -120 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 1.5 * this.wave_speed * this.wave_direction,
            });

            //curve 1 point 2
            this.curve_points.push({
                local_origin: add_vec(
                    { ...half_base_vector },
                    { x: this.l * this.wave_direction * 0, y: this.l * 0 }
                ),
                base: rotate_vector({ ...half_base_vector }, -60 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 3.5 * this.wave_speed * this.wave_direction,
            });

            //curve 1 point 3
            this.curve_points.push({
                local_origin: add_vec(
                    mul_vec({ ...half_base_vector }, 0.8),
                    { x: this.l * this.wave_direction * -0.2, y: this.l * 0 }
                ),
                base: rotate_vector({ ...half_base_vector }, 30 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 1.5 * this.wave_speed * this.wave_direction,
            });
            this.wave_tip = this.curve_points[3].real;

            //curve 2 point 1
            this.curve_points.push({
                local_origin: { x: 0, y: 0 },
                base: rotate_vector(mul_vec({...half_base_vector}, this.wave_thickness), -90 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 0,
            });
            this.wave_end = this.curve_points[4].real;

            //curve 2 point 2
            this.curve_points.push({
                local_origin: add_vec(
                    { ...half_base_vector },
                    { x: -this.l * this.wave_direction * 0.125, y: this.l * 0.075 }
                ),
                base: rotate_vector(mul_vec({ ...half_base_vector }, 1.3), -110 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 2.6 * this.wave_speed * this.wave_direction,
            });

            //curve 2 point 3
            this.curve_points.push({
                local_origin: add_vec(
                    { ...half_base_vector },
                    { x: -this.l * this.wave_direction * 0.025, y: -this.l * 0.1 }
                ),
                base: rotate_vector(mul_vec({ ...half_base_vector }, 1.2), -50 * this.wave_direction),
                real: { x: 0, y: 0 },
                speed: 3.5 * this.wave_speed * this.wave_direction,
            });

        }

        update_rotating_point(point){
            rotate_vector(point.base, point.speed);
            point.x = point.base.x + point.local_origin.x;
            point.y = point.base.y + point.local_origin.y;
            rotate_vector(point, this.current_rotation);
        }

        update_rotating_point_with_real(point){
            point.real.x = point.x + this.origin.x;
            point.real.y = point.y + this.origin.y;
        }

        update_wave(){
            for(let i=1; i<7; i++){
                this.update_rotating_point(this.curve_points[i]);
            }
            this.current_rotation += this.rotation_speed;
        }

        update_wave_with_real(){
            for(let i=0; i<7; i++){
                this.update_rotating_point_with_real(this.curve_points[i]);
            }
        }

        draw_debug_points(){
            for(let i=0; i<7; i++){
                this.ctx.fillRect(
                    this.curve_points[i].real.x,
                    this.curve_points[i].real.y,
                    2,
                    2
                );
            }
        }

        draw_curves(){
            ctx.moveTo(
                this.curve_points[0].real.x,
                this.curve_points[0].real.y
            );

            ctx.bezierCurveTo(
                this.curve_points[1].real.x,
                this.curve_points[1].real.y,
                this.curve_points[2].real.x,
                this.curve_points[2].real.y,
                this.curve_points[3].real.x,
                this.curve_points[3].real.y
            );

            ctx.bezierCurveTo(
                this.curve_points[6].real.x,
                this.curve_points[6].real.y,
                this.curve_points[5].real.x,
                this.curve_points[5].real.y,
                this.curve_points[4].real.x,
                this.curve_points[4].real.y
            );
        }

        draw(){
            if(this.deleted) return;
            if(this.counter >= this.max_iterations){
                this.deleted = true;
            }
            this.counter += 1;
            this.update_wave();
            this.update_wave_with_real();
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.lineCap = "round";
            // let fill_gradient = this.ctx.createRadialGradient(this.wave_tip.x, this.wave_tip.y, 0, this.wave_tip.x, this.wave_tip.y, this.l);
            // fill_gradient.addColorStop(0, "rgb(255, 255, 255)");
            // fill_gradient.addColorStop(0.5, "rgb(255, 255, 255)");
            // fill_gradient.addColorStop(1, "rgba(0,0,0,0)");
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = "white";
            this.ctx.fillStyle = "rgb(0, 0, 30)";
            this.draw_curves();
            this.ctx.fill();
            this.ctx.stroke();
            // this.draw_debug_points();
            this.ctx.restore();
        }

    }

    function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update_waves();
        setTimeout(requestAnimationFrame, 0, animate);
    }

    waves.push(new Wave(ctx, {x: 500, y: 700 }, 50, 45, 1, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, 0, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, -45, 1, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, -90, 1, 1));

    waves.push(new Wave(ctx, {x: 550, y: 700 }, 50, 45, 1, 1, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, 0, 1, 1, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, -45, 1, 1, 1));
    waves.push(new Wave(ctx, waves[waves.length - 1].wave_end, 50, -90, 1, 1, 1));

    animate();

}