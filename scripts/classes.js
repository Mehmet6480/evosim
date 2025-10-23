class Entity{

    constructor(x, y){
        this.position_x = x;
        this.position_y = y;
    }
    find_dist(x, y){
        let x_component = (x - this.position_x) ** 2;
        let y_component = (y - this.position_y) ** 2;
        return x_component+y_component;
    }

}

export class ProtoMahlukat extends Entity{
    static mahlukat_names = ["Isabella", "Vincentio", "Claudio", "Angelo", "Escalus", "Lucio", "Mariana", "Pompey", "Provost", "Elbow", "Barnadine", "Juliet"];

    constructor(x, y, speed){
        super(x, y);
        this.speed = speed;
        let selection_index = Math.floor(Math.random()*ProtoMahlukat.mahlukat_names.length);
        this.name = ProtoMahlukat.mahlukat_names[selection_index];
    }

    print(){
        return `pos x: ${this.position_x}, pos y: ${this.position_y}, speed: ${this.speed}`;
    }

    assign_target_food(food_list, return_food = false, debug = false){
        let current_min_dist = Infinity;
        let min_idx = 0;
        for(let i in food_list){
            let current_dist = (food_list[i].position_x - this.position_x)**2 + (food_list[i].position_y - this.position_y)**2;
            if (current_dist < current_min_dist){
                current_min_dist = current_dist;
                min_idx = i;
            }
        }
        food_list[min_idx].children.push(this);
        
        if(return_food){
            return min_idx;
        }
    }

    travel_towards(target_x, target_y){
        // This method is to determine how a mahlukat's coordinates will change in a tick it is traveling towards a target. 
        let total_distance = this.find_dist(target_x, target_y) ** 0.5;
        let difference_y = target_y - this.position_y;
        let difference_x = target_x - this.position_x;
        // ^Total target displacement vector determined

        // these variables are for the displacement in ONE TICK of movement
        let delta_x;
        let delta_y;

        delta_x = difference_x / total_distance * this.speed;
        delta_y = difference_y / total_distance * this.speed; 

        this.position_x += delta_x;
        this.position_y += delta_y;
    }
}

export class Food extends Entity{
    
    constructor(x, y){
        super(x,y);
        this.children = [];
    }

    print(){
        let childCoords = this.children
        .map(c => (`[${c.position_x.toFixed(1)}, ${c.position_y.toFixed(1)}]`))
        .join(", ");
        return `pos x: ${this.position_x.toFixed(1)}, pos y: ${this.position_y.toFixed(1)}, pursuers: ${childCoords}`;
    }

    find_closest_child(){
        if (this.children.length === 0){
            return null;
        }
        let current_min_distance = Infinity;
        let closest_mahlukat = null;
        for(let mahlukat of this.children){
            let current_dist = mahlukat.find_dist(this.position_x, this.position_y);
            if(current_dist < current_min_distance){
                current_min_distance = current_dist;
                closest_mahlukat = mahlukat;
            }
        }
        return closest_mahlukat;
    }

}