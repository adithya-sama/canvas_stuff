function abyss(
    canvas_id,
    max_square_size,
    min_move_step_percentage,
    max_move_step_percentage,
    min_rotation_step,
    max_rotation_step,
    color_set,
    fade_rate
) {

    let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvas_id));

    canvas.onmousemove = (e) => {
        mouse_pos["x"] = e.x;
        mouse_pos["y"] = e.y;
    }

    let mouse_pos = {
        "x": 0,
        "y": 0
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let x_center = window.innerWidth / 2;

    let ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // some stupid custom function
    function curve(x) {
        // more z more squares.
        let z = 5;
        res = 1 / (1 + Math.exp(z - (15 * x)));
        return res;
    }

    function rand_range(min, max) {
        return min + ((max - min) * Math.random());
    }

    function draw_rotate_square(x, y, size, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle * Math.PI / 180);
        ctx.beginPath();
        ctx.rect(-size / 2, -size / 2, size, size);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    }

    function mirrored_square(x, y, size) {

        this.ox = x;
        this.oy = y;
        this.x = x;
        this.y = y;
        this.mx = 0;
        this.my = 0;
        this.size = size;
        this.degrees = Math.random() * 360;
        this.degree_step = rand_range(min_rotation_step, max_rotation_step);
        this.move_step = canvas.width * rand_range(min_move_step_percentage, max_move_step_percentage);
        this.move_step *= (Math.random() > 0.5) ? 1 : -1;
        this.first_render = true;
        this.current_color = [];
        let rgb = color_set[Math.floor(Math.random() * color_set.length)];
        darken_color(rgb, curve((Math.abs(x_center - this.x) / x_center)) * 100, this.current_color);
        this.strokeStyle = `rgb(${this.current_color[0]},${this.current_color[1]},${this.current_color[2]})`;
        this.mouse_prox = 150;
        this.touched = false;

        this.draw = () => {
            draw_rotate_square(this.x, this.y, this.size, this.degrees, this.strokeStyle);
            draw_rotate_square(this.mx, this.my, this.size, -this.degrees, this.strokeStyle);
        }

        this.update = () => {
            this.current_move_target = Math.random();
            this.x = (this.move_step + this.x) % canvas.width;
            this.y = (this.move_step + this.y) % canvas.height;
            this.mx = canvas.width - this.x;
            this.my = this.y;
            this.degrees = (this.degrees + this.degree_step) % 360;

            if (
                (Math.abs(mouse_pos.x - this.x) <= this.mouse_prox) &&
                (Math.abs(mouse_pos.y - this.y) <= this.mouse_prox)
            ) {
                this.first_render = false;
                if (!this.touched) {
                    let rgb = color_set[Math.floor(Math.random() * color_set.length)];
                    this.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
                    this.current_color[0] = rgb[0];
                    this.current_color[1] = rgb[1];
                    this.current_color[2] = rgb[2];
                    this.touched = true;
                }
            } else if (!this.first_render) {
                darken_color(this.current_color, fade_rate, this.current_color);
                this.strokeStyle = `rgb(${this.current_color[0]},${this.current_color[1]},${this.current_color[2]})`;
                this.touched = false;
            }

            this.draw();
        }

    }

    let n_of_s = 64;

    let squares = [];

    for (let i = 0; i < n_of_s; i++) {
        squares.push(new mirrored_square(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * max_square_size));
    }

    function animate() {
        for (s in squares) {
            squares[s].update();
        }
        setTimeout(requestAnimationFrame, 50, animate);
    }

    animate();
}
