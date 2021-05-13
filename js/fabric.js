class Fabric{
    constructor(ctx, density=1, max_speed=1, max_step=100, max_move_speed = 2){
        this.ctx = ctx;
        this.dust_canvas = document.createElement('canvas');
        this.dust_ctx = init_canvas(this.dust_canvas);
        this.canvas_width = this.ctx.canvas.width;
        this.canvas_height = this.ctx.canvas.height;
        this.density = density;
        this.max_speed = max_speed;
        this.max_move_speed = max_move_speed;
        this.move_speed_decay = 0.99;
        this.size = 1;
        this.max_step = max_step;
        // dont change slant_ratio. all the mouse calculations are based on the lines being 45 degress.
        this.slant_ratio = 1;
        this.frame_num = 0;
        this.current_density = 0;
        this.thread_opacity_speed = 1.003;
        this.split_at_opacity = 0.8;
        this.dust_lines = [];
        this.threads = [];
        this.deleted_threads = [];
        this.pluck_state = 0;
        this.plucked_thread = undefined;
        this.pluck_release_dist = 80;
        this.pluck_show_threads = [
            {
                start: {
                    x: 0,
                    y: 0
                },
                end: {
                    x: 0,
                    y: 0
                },
            },
            {
                start: {
                    x: 0,
                    y: 0
                },
                end: {
                    x: 0,
                    y: 0
                },
            }
        ];
        this.init_dust_lines();
        this.init_threads();
        this.init_mouse();
    }

    init_mouse(){
        this.ctx.canvas.onmousemove=(e)=>{
            // this.ctx.getImageData(e.x, e.y, 1, 1);
            // let c = this.ctx.getImageData(e.x, e.y, 1, 1).data;
            // if(c[0] == 0 && c[1] == 0 && c[2] == 0) return;
            if(this.pluck_state == 1){
                this.update_pluck_show_threads(e.x, e.y);
            }else{
                this.threads.some(thread => {
                    if (this.is_mouse_on_thread(thread, e.x, e.y)) {
                        this.pluck_thread(thread);
                        this.update_pluck_show_threads(e.x, e.y);
                        return true;
                    }
                    return false;
                });
            }
        }
    }
    
    is_mouse_on_thread(thread, x, y){
        //if(thread.moving) return false;
        let tmp;
        if(thread.slope == 1){
            tmp = Math.abs((x + y) - thread.start.y);
        }else{
            tmp = Math.abs(((this.canvas_width - x) + y) - thread.start.y);
        }
        if(tmp <= 5) return true;
        return false;
    }

    pluck_thread(thread){
        this.pluck_state = 1;
        this.plucked_thread = thread;
        thread.disable = true;
        this.pluck_show_threads[0].end.x = thread.end.x;
        this.pluck_show_threads[0].end.y = thread.end.y;
        this.pluck_show_threads[1].end.x = thread.start.x;
        this.pluck_show_threads[1].end.y = thread.start.y;
    }

    update_pluck_show_threads(x, y){
        let tmp;
        if(this.plucked_thread.slope == 1){
            tmp = Math.abs((x + y) - this.plucked_thread.start.y);
        }else{
            tmp = Math.abs(((this.canvas_width - x) + y) - this.plucked_thread.start.y);
        }
        if(tmp > this.pluck_release_dist){
            this.pluck_state = 2;
            this.plucked_thread.disable = false;
            this.plucked_thread = undefined;
        }else{
            this.pluck_show_threads[0].start.x = x;
            this.pluck_show_threads[0].start.y = y;
            this.pluck_show_threads[1].start.x = x;
            this.pluck_show_threads[1].start.y = y;
        }
    }

    init_dust_lines(){
        for(let i=0; i<this.density; i++){
            this.dust_lines.push(this.create_dust_line());
        }
    }

    create_dust_line(){
        let base_random_x = this.get_random_x();
        let dust_line = {
            start: {
                x: base_random_x,
                // x: 0,
                y: this.get_random_y(),
                speed: this.get_random_speed(),
                direction: this.get_random_direction(),
            },
            end: {
                x: this.get_random_x(),
                // x: this.canvas_width,
                y: this.get_random_y(),
                speed: this.get_random_speed(),
                direction: this.get_random_direction(),
            }
        };
        return dust_line;
    }

    update_dust_line(index){
        let dust_line = this.dust_lines[index];

        dust_line.start.y += (dust_line.start.speed * dust_line.start.direction);
        if(dust_line.start.y <= 0)
            dust_line.start.y = this.canvas_height;
        if(dust_line.start.y > this.canvas_height)
            dust_line.start.y = 0;

        dust_line.end.y += (dust_line.end.speed * dust_line.end.direction);
        if(dust_line.end.y <= 0)
            dust_line.end.y = this.canvas_height;
        if(dust_line.end.y > this.canvas_height)
            dust_line.end.y = 0;

    }

    update_dust_lines(){
        for(let i=0; i<this.density; i++){
            this.update_dust_line(i);
        }
    }

    draw_dust_lines(){
        this.dust_ctx.save();
        this.dust_ctx.clearRect(
            0, 0,
            this.canvas_width, this.canvas_height
        );
        this.dust_ctx.lineWidth = 1;
        this.dust_ctx.strokeStyle = "rgb(255, 255, 255)";
        for(let i=0; i<this.density; i++){
            let dust_line = this.dust_lines[i];
            this.dust_ctx.beginPath();
            this.dust_ctx.moveTo(dust_line.start.x, dust_line.start.y);
            this.dust_ctx.lineTo(dust_line.end.x, dust_line.end.y);
            this.dust_ctx.stroke();
        }
        this.dust_ctx.restore();
        this.ctx.drawImage(this.dust_canvas, 0, 0);
    }

    add_thread(start_x, start_y, end_x, end_y, opacity, opacity_speed, opacity_direction=1, moving=false, move_speed=1, move_direction=1, slope=1){
        if(this.deleted_threads.length > 0){
            let thread = this.threads[this.deleted_threads.pop()];
            thread.start.x = start_x;
            thread.start.y = start_y;
            thread.end.x = end_x;
            thread.end.y = end_y;
            thread.opacity = opacity;
            thread.opacity_speed = opacity_speed;
            thread.opacity_direction = opacity_direction;
            thread.moving = moving;
            thread.move_speed = move_speed;
            thread.move_direction = move_direction;
            thread.slope = slope;
            thread.delete = false;
        }else{
            this.threads.push({
                start: {
                    x: start_x,
                    y: start_y
                },
                end: {
                    x: end_x,
                    y: end_y
                },
                opacity: opacity,
                opacity_speed: opacity_speed,
                opacity_direction: opacity_direction,
                moving: moving,
                move_speed: move_speed,
                move_direction: move_direction,
                slope: slope,
                delete: false,
                disable: false
            });
        }
    }

    init_threads(){
        let box_height = this.canvas_width + this.canvas_height;
        let step = 0;
        let current_y = 0;
        let current_x = 0;
        while(current_y <= box_height){
            step = this.get_random_step();
            current_y += step;
            current_x += step * this.slant_ratio;
            this.add_thread(
                0, current_y,
                current_x, 0,
                this.get_random_opacity(), this.thread_opacity_speed, 1,
                false, 1, 1,
                1
            );
        }

        current_y = 0;
        current_x = this.canvas_width;
        while(current_y <= box_height){
            step = this.get_random_step();
            current_y += step;
            current_x -= step * this.slant_ratio;
            this.add_thread(
                this.canvas_width, current_y,
                current_x, 0,
                this.get_random_opacity(), this.thread_opacity_speed, 1,
                false, 1, 1,
                -1
            )
        }
    }

    update_thread(index){
        let thread = this.threads[index];
        if(thread.disable) return;
        if(thread.delete){
            this.deleted_threads.push(index);
            return;
        }
        if(thread.opacity >= this.split_at_opacity){
            let random_move_direction = this.get_random_direction();
            let random_opacity_direction = this.get_random_direction();
            thread.opacity = this.get_random_opacity();
            thread.opacity_speed = this.thread_opacity_speed;
            thread.opacity_direction = random_opacity_direction;
            thread.moving = true;
            thread.move_speed = this.get_random_move_speed();
            thread.move_direction = random_move_direction;
            this.add_thread(
                thread.start.x, thread.start.y,
                thread.end.x, thread.end.y,
                this.get_random_opacity(), this.thread_opacity_speed, random_opacity_direction * -1,
                true, this.get_random_move_speed(), random_move_direction * -1,
                thread.slope
            );
        }else{
            if(thread.moving){
                thread.start.y += (thread.move_speed * thread.move_direction);
                if(thread.slope == 1){
                    thread.end.x += (thread.move_speed * thread.move_direction);
                }else{
                    thread.end.x -= (thread.move_speed * thread.move_direction);
                }
                thread.move_speed *= this.move_speed_decay;
                if(thread.move_speed <= 0.05){
                    thread.move_speed = 0;
                    thread.moving = false;
                }
            }else{
                thread.opacity *= thread.opacity_speed * thread.opacity_direction;
                if(thread.opacity <= 0){
                    thread.delete = true;
                }
            }
        }
    }

    update_threads(){
        for(let i=this.threads.length - 1; i>0; i--){
            this.update_thread(i);
        }
    }

    draw_threads(){
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(
            0, 0,
            this.canvas_width, this.canvas_height
        );
        this.ctx.lineWidth = 1;
        for(let i=this.threads.length - 1; i>0; i--){
            let thread = this.threads[i];
            if(thread.disable || thread.delete) continue;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${thread.opacity})`;
            this.ctx.beginPath();
            this.ctx.moveTo(thread.start.x, thread.start.y);
            this.ctx.lineTo(thread.end.x, thread.end.y);
            this.ctx.stroke();
        }
        if(this.pluck_state == 1){
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.plucked_thread.opacity})`;
            this.ctx.beginPath();
            this.ctx.moveTo(this.pluck_show_threads[0].start.x, this.pluck_show_threads[0].start.y);
            this.ctx.lineTo(this.pluck_show_threads[0].end.x, this.pluck_show_threads[0].end.y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.pluck_show_threads[1].start.x, this.pluck_show_threads[1].start.y);
            this.ctx.lineTo(this.pluck_show_threads[1].end.x, this.pluck_show_threads[1].end.y);
            this.ctx.stroke();
        }
    }

    get_random_direction(){
        return (Math.random() < 0.5) ? 1 : -1;
    }

    get_random_speed(){
        return Math.max(0.3, Math.random() * this.max_speed);
    }

    get_random_move_speed(){
        return Math.max(0.5, Math.random() * this.max_move_speed);
    }
    
    get_random_step(){
        return Math.max(5, Math.random() * this.max_step);
    }

    get_random_opacity(){
        return Math.random() * 0.5;
    }

    get_random_x(){
        return Math.floor(Math.random() * this.canvas_width);
    }

    get_random_y(){
        return Math.floor(Math.random() * this.canvas_height);
    }

    draw(){
        this.frame_num += 1;
        this.ctx.clearRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.save();
        this.draw_threads();
        this.ctx.globalCompositeOperation = 'color-dodge';
        this.draw_dust_lines();
        this.ctx.globalCompositeOperation = '';
        this.ctx.restore();
    }

    next_frame(){
        this.update_threads();
        this.update_dust_lines();
        this.draw();
    }

}

function animate(animation_obj) {
    animation_obj.next_frame();
    requestAnimationFrame(animate.bind(null, animation_obj));
}

function run_fabric(canvas_id){
    let ctx = init_canvas(canvas_id);
    let fabric_obj = new Fabric(ctx, density=50, max_speed=1, max_step=300);
    animate(fabric_obj);
}