class Fabric{
    constructor(ctx, density=1, max_speed=1, max_step=100){
        this.ctx = ctx;
        this.canvas_1 = document.createElement('canvas');
        this.ctx_1 = init_canvas(this.canvas_1);
        this.canvas_2 = document.createElement('canvas');
        this.ctx_2 = init_canvas(this.canvas_2);
        this.canvas_width = this.ctx_1.canvas.width;
        this.canvas_height = this.ctx_1.canvas.height;
        this.density = density;
        this.max_speed = max_speed;
        this.size = 1;
        this.max_step = max_step;
        this.slant_ratio = 1;
        this.init_dust_lines();
        this.draw_threads();
    }

    init_dust_lines(){
        this.dust_lines = [];
        for(let i=0; i<this.density; i++){
            this.dust_lines.push(this.create_dust_line());
        }
    }

    get_random_x(){
        return Math.floor(Math.random() * this.canvas_width);
    }

    get_random_y(){
        return Math.floor(Math.random() * this.canvas_height);
    }

    get_random_direction(){
        return (Math.random() < 0.5) ? 1 : -1;
    }

    get_random_speed(){
        return Math.max(0.3, Math.random() * this.max_speed);
    }
    
    get_random_step(){
        return Math.max(5, Math.random() * this.max_step);
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
        this.ctx_2.fillStyle = "black";
        this.ctx_2.fillRect(
            0, 0,
            this.canvas_width, this.canvas_height
        );
        for(let i=0; i<this.density; i++){
            let dust_line = this.dust_lines[i];
            this.ctx_2.lineWidth = 1;
            this.ctx_2.strokeStyle = "rgb(255, 255, 255)";
            this.ctx_2.beginPath();
            this.ctx_2.moveTo(dust_line.start.x, dust_line.start.y);
            this.ctx_2.lineTo(dust_line.end.x, dust_line.end.y);
            this.ctx_2.stroke();
        }
    }

    draw_threads(){
        this.ctx_1.fillStyle = "black";
        this.ctx_1.fillRect(
            0, 0,
            this.canvas_width, this.canvas_height
        );
        this.ctx_1.lineWidth = 1;
        let box_height = this.canvas_width + this.canvas_height;
        let step = 0;
        let current_y = 0;
        let current_x = 0;
        while(current_y <= box_height){
            step = this.get_random_step();
            current_y += step;
            current_x += step * this.slant_ratio;
            this.ctx_1.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.8, Math.min(0.1, Math.random()))})`;
            this.ctx_1.beginPath();
            this.ctx_1.moveTo(0, current_y);
            this.ctx_1.lineTo(current_x, 0);
            this.ctx_1.stroke();
        }

        current_y = 0;
        current_x = this.canvas_width;
        while(current_y <= box_height){
            step = this.get_random_step();
            current_y += step;
            current_x -= step * this.slant_ratio;
            this.ctx_1.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.7, Math.min(0.1, Math.random()))})`;
            this.ctx_1.beginPath();
            this.ctx_1.moveTo(this.canvas_width, current_y);
            this.ctx_1.lineTo(current_x, 0);
            this.ctx_1.stroke();
        }
    }

    draw(){
        //this.draw_steps();
        this.draw_dust_lines();
        this.ctx.clearRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.drawImage(this.canvas_1, 0, 0);
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.drawImage(this.canvas_2, 0, 0);
    }

    next_frame(){
        this.update_dust_lines();
        this.draw();
    }

}

function animate(animation_obj) {
    animation_obj.next_frame();
    setTimeout(requestAnimationFrame, 0, animate.bind(null, animation_obj));
}

function run_fabric(canvas_id){

    let ctx = init_canvas(canvas_id);
    let fabric_obj = new Fabric(ctx, density=100, max_speed=2, max_step=200);
    animate(fabric_obj);

}