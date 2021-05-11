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
        this.slant_ratio = 1;
        this.fabric_initialised = false;
        this.frame_num = 0;
        this.current_density = 0;
        this.thread_opacity_speed = 0.0005;
        this.dust_lines = [];
        this.threads = [];
        this.init_dust_lines();
        this.init_threads();
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
        // this.dust_ctx.fillStyle = "rgba(0,0,0,1)";
        // this.dust_ctx.fillRect(
        //     0, 0,
        //     this.canvas_width, this.canvas_height
        // );
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
            delete: false
        });
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
        if(thread.delete){
            this.threads.splice(index, 1);
            return;
        }
        if(thread.opacity >= 0.6){
            let random_move_direction = this.get_random_direction();
            let random_opacity_direction = this.get_random_direction();
            this.add_thread(
                thread.start.x, thread.start.y,
                thread.end.x, thread.end.y,
                this.get_random_opacity(), this.thread_opacity_speed, random_opacity_direction,
                true, this.get_random_move_speed(), random_move_direction,
                thread.slope
            );
            this.add_thread(
                thread.start.x, thread.start.y,
                thread.end.x, thread.end.y,
                this.get_random_opacity(), this.thread_opacity_speed, random_opacity_direction * -1,
                true, this.get_random_move_speed(), random_move_direction * -1,
                thread.slope
            );
            this.threads.splice(index, 1);
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
                thread.opacity += thread.opacity_speed * thread.opacity_direction;
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
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${thread.opacity})`;
            this.ctx.beginPath();
            this.ctx.moveTo(thread.start.x, thread.start.y);
            this.ctx.lineTo(thread.end.x, thread.end.y);
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
    let fabric_obj = new Fabric(ctx, density=70, max_speed=1, max_step=300);
    animate(fabric_obj);

}