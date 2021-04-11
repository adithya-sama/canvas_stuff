
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
            waves.push(
                new WaveOld(
                    x = mouse_pos.x,
                    y = mouse_pos.y,
                    ox = old_mouse_pos.x,
                    oy = old_mouse_pos.y,
                    spread = 60,
                    speed = 0.05
                )
            );
        }
        first = false;
    }

    let waves = [];

    function update_waves(){
        for(let i=0; waves[i] != undefined; i++){
            waves[i].update();
            if(waves[i].deleted){
                waves.splice(i, 1);
            }
        }
    }


    class WaveOld {

        constructor(x, y, ox, oy, spread, speed, alive_till=2000) {

            this.alive_till = get_timestamp() + alive_till;
            this.x = x;
            this.y = y;
            this.ox = ox;
            this.oy = oy;
            this.x = this.x - this.ox;
            this.y = this.y - this.oy;
            this.spread = spread;
            this.speed = speed;
            this.color = [0, 69, 117, 1]; //rgb(0, 69, 117)
            this.start = false;
            this.deleted = false;
            this.init();

        }

        draw_curve(){
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = arr2rgba(this.color);
            ctx.moveTo(...this.get_orig_cord(...this.wave_ends[0]));
            ctx.quadraticCurveTo(
                ...this.get_orig_cord(...this.wave_center),
                ...this.get_orig_cord(...this.wave_ends[1])
            );
            ctx.stroke();
            ctx.restore();
            this.wave_ends[0] = add_vec(...(this.wave_ends[0]), ...(this.wave_ends_speed[0]));
            this.wave_center = add_vec(...this.wave_center, ...this.center_speed);
            this.wave_ends[1] = add_vec(...(this.wave_ends[1]), ...(this.wave_ends_speed[1]));
            fade_color(this.color, 2, this.color);
        };

        get_orig_cord(x, y){
            return [x + this.ox, y + this.oy];
        }

        get_wave_ends(x, y, angle){
            let ret = [];
            let tmp = rotate_vector({x: x, y: y}, angle);
            ret.push([tmp.x, tmp.y]);
            tmp = rotate_vector({x: x, y: y}, -angle);
            ret.push([tmp.x, tmp.y]);
            return ret;
        }

        init(){
            this.wave_center = [this.x, this.y];
            this.wave_ends = this.get_wave_ends(this.x, this.y, this.spread);
            this.center_speed = [this.x * this.speed, this.y * this.speed];
            this.wave_ends_speed = [
                [this.wave_ends[0][0] * this.speed, this.wave_ends[0][1] * this.speed],
                [this.wave_ends[1][0] * this.speed, this.wave_ends[1][1] * this.speed],
            ]
        }
        
        update(){
            this.draw_curve();
            if (get_timestamp() >= this.alive_till){
                this.deleted = true;
            }
        }

    }

    class Wave{

        constructor(origin, length, initial_rotation){
            this.length = length;
            this.origin = origin;
            this.initial_rotation = initial_rotation;
            this.ctx = ctx;
            this.curve_points = [];
            this.init();
        }

        init(){

            let half_base_vector = {
                x: 0,
                y: -this.length / 2
            }
         
            //curve 0 point 0
            this.curve_points.push({
                update: false,
                x: 0,
                y: 0
            });

            //curve 1 point 1
            this.curve_points.push({
                update: true,
                local_origin: add_vec({...half_base_vector}, { x: 15, y: 20}),
                base: rotate_vector({...half_base_vector}, -120),
                speed: 1.8,
            });

            //curve 2 point 2
            this.curve_points.push({
                update: true,
                local_origin: add_vec({...half_base_vector}, { x: 0, y: 0}),
                base: rotate_vector({...half_base_vector}, -60),
                speed: 3,
            });

            //curve 3 point 3
            this.curve_points.push({
                update: true,
                local_origin: add_vec(mul_vec({...half_base_vector}, 0.8), { x: -40, y: 0}),
                base: rotate_vector({...half_base_vector}, 30),
                speed: 1.5,
            });

            //curve 4 point 4
            this.curve_points.push({
                update: false,
                x: this.length * -0.35,
                y: 0,
            });

            //curve 5 point 5
            this.curve_points.push({
                update: true,
                local_origin: add_vec({...half_base_vector}, { x: -this.length * 0.125, y: this.length * 0.075}),
                base: rotate_vector(mul_vec({...half_base_vector}, 1.3), -110),
                speed: 2.6,
            });

            //curve 6 point 6
            this.curve_points.push({
                update: true,
                local_origin: add_vec({...half_base_vector}, { x: -this.length * 0.025, y: -this.length * 0.1}),
                base: rotate_vector(mul_vec({...half_base_vector}, 1.1), -60),
                speed: 3.5,
            });

        }

        update_rotating_point(point){
            if(point.update){
                rotate_vector(point.base, point.speed);
                point.x = point.base.x + point.local_origin.x;
                point.y = point.base.y + point.local_origin.y;
            }
        }

        update_rotating_point_with_real(point){
            point.rx = point.x + this.origin.x;
            point.ry = point.y + this.origin.y;
        }

        update_wave(){
            for(let i=0; i<7; i++){
                this.update_rotating_point(this.curve_points[i]);
            }
        }

        update_wave_with_real(){
            for(let i=0; i<7; i++){
                this.update_rotating_point_with_real(this.curve_points[i]);
            }
        }

        draw_debug_points(){
            for(let i=0; i<7; i++){
                this.ctx.fillRect(
                    this.curve_points[i].rx,
                    this.curve_points[i].ry,
                    2,
                    2
                );
            }
        }

        draw_curves(){

            ctx.moveTo(
                this.curve_points[0].rx,
                this.curve_points[0].ry
            );

            ctx.bezierCurveTo(
                this.curve_points[1].rx,
                this.curve_points[1].ry,
                this.curve_points[2].rx,
                this.curve_points[2].ry,
                this.curve_points[3].rx,
                this.curve_points[3].ry
            );

            ctx.moveTo(
                this.curve_points[4].rx,
                this.curve_points[4].ry
            );

            ctx.bezierCurveTo(
                this.curve_points[5].rx,
                this.curve_points[5].ry,
                this.curve_points[6].rx,
                this.curve_points[6].ry,
                this.curve_points[3].rx,
                this.curve_points[3].ry
            );
        }

        draw(){
            this.update_wave();
            this.update_wave_with_real();
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgb(255, 255, 255)";
            this.ctx.fillStyle = "rgb(255, 255, 255)";
            this.draw_curves();
            this.draw_debug_points();
            this.ctx.stroke();
            this.ctx.restore();
        }

    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // update_waves();
        wave.draw();
        setTimeout(requestAnimationFrame, 50, animate);
    }
    
    let wave = new Wave({x: 500, y: 700 }, 200, ctx);

    animate();

}