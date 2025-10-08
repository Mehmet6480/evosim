import { renderSimulation, renderGraph } from "./render.js";

class Mahlukat{
    static mahlukat_names = ["Isabella", "Vincentio", "Claudio", "Angelo", "Escalus", "Lucio", "Mariana", "Pompey", "Provost", "Elbow", "Barnadine", "Juliet"];
    position_x;
    position_y;
    speed;
    days_alive;
    energy;
    target_food;

    constructor(x, y, speed){
        this.position_x = x;
        this.position_y = y;
        this.speed = speed;
        let selection_index = Math.floor(Math.random()*Mahlukat.mahlukat_names.length);
        this.name = Mahlukat.mahlukat_names[selection_index];

        this.energy = 200;
        this.days_alive = 0
    }

    print(){
        return `pos x: ${this.position_x}, pos y: ${this.position_y}, speed: ${this.speed}`;
    }

    assign_target_food(food_list){

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
        this.target_food = food_list[min_idx];
    }
    find_dist(x, y){
        let x_component = (x - this.position_x) ** 2;
        let y_component = (y - this.position_y) ** 2;
        return x_component+y_component;
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

        let energy_consumption = this.speed**2;
        this.energy -= energy_consumption;
        if (this.energy <= 0 ||  this.days_alive > 15){
            mahlukats.splice(mahlukats.indexOf(this) , 1);
            console.log(foods);
            console.log(this);
            if(this.target_food) {this.target_food.children.splice(this.target_food.children.indexOf(this), 1); }
            this.target_food = null;
            return;
        }
        
        this.position_x += delta_x;
        this.position_y += delta_y;
    }
}

class Food{
    position_x;
    position_y;
    children;

    constructor(x, y){
        this.position_x = x;
        this.position_y = y;
        this.children = []
    }

    print(){
        let childCoords = this.children
        .map(c => (`[${c.position_x.toFixed(1)}, ${c.position_y.toFixed(1)}]`))
        .join(", ");

        return `pos x: ${this.position_x.toFixed(1)}, pos y: ${this.position_y.toFixed(1)}, pursuers: ${childCoords}`;
    }

    find_closest_child(){
        let current_min_distance = Infinity;
        let closest_mahlukat;
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

let mahlukats = [];
let foods = [];
let stats = { day : 1 };
let average_speeds = [];
let populations = [];

function initiate_entities(number_of_foods, number_of_mahlukat, starting_speeds){
    for(let i = 0; i < number_of_mahlukat; i++){
        let new_mahlukat = new Mahlukat(Math.random() * 100, Math.random() * 100, starting_speeds * (Math.random() * 1.0 + 0.5)); // random coordinates, up to 50% deviation from avg starting speed
        mahlukats.push(new_mahlukat);
    }
    for(let i = 0; i < number_of_foods; i++){
        let new_food = new Food(Math.random() * 100, Math.random() * 100); // 0-100, 0-100, []
        foods.push(new_food);
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function avg_speed(mahlukat_list){
    let sum = 0;
    for(let mahlukat of mahlukat_list){
        sum += mahlukat.speed;
    }
    return sum/mahlukat_list.length;
}

function updateStats() {
  const stats_element = document.getElementById('stats');
  if (stats_element){
      stats_element.textContent = `Day: ${stats.day} | Mahlukats: ${stats.mahlukats} | Avg speed: ${stats.avg_speed.toFixed(3)}`;
  }
}

let isPaused = false;
async function simulate(simulation_length, startingMahlukats = 10, startingFoods = 10, replenishing_food_count = 10, starting_speeds = 0.45){
    initiate_entities(startingFoods, startingMahlukats, starting_speeds);
    stats["mahlukats"] = startingMahlukats;
    stats["avg_speed"] = avg_speed(mahlukats);
    updateStats();
    let data = [];

    let delta_time = 0;
    let day = 1;
    let time_interval = 1;

    for(let mahlukat of mahlukats){ 
        mahlukat.assign_target_food(foods); 
    }

    


    while (day <= simulation_length){

        // no mahlukats left?
        if (mahlukats.length == 0) {
            document.getElementById("debug").textContent = "Simulation Over! All mahlukats died.";
            simulation_running = false;
            reset_stats();
            break;
        }

        while(isPaused){
            await sleep(10);
        }
        let foods_copy = Array.from(foods);
        for(let food of foods_copy){
            if(food.children.length == 0){
                continue;
            }
            let closest_child = food.find_closest_child();
            let food_to_child_distance = (closest_child.find_dist(food.position_x, food.position_y)) ** 0.5;
            let travel_distance = time_interval * closest_child.speed;
            // check if the closest child will reach the food.

            for(let mahlukat of food.children){
                mahlukat.travel_towards(food.position_x, food.position_y);
            }
            
            if(travel_distance > food_to_child_distance){
                [closest_child.position_x, closest_child.position_y] = [food.position_x, food.position_y];
                foods.splice(foods.indexOf(food), 1);
                closest_child.energy += 200

                if(foods.length > 0){
                    for(let mahlukat of food.children){
                        mahlukat.assign_target_food(foods);
                    }
                }

            }
            document.getElementById("debug").textContent = "Simulated Frames: " + delta_time;
        }
        delta_time++;
        await sleep(1000/simulation_speed);
        renderSimulation(mahlukats, foods);

        if(foods.length == 0){ // End of day
            for(let i = 0; i < replenishing_food_count; i++){ // Replenish food
                let new_food = new Food(Math.random() * 100, Math.random() * 100);
                foods.push(new_food);
            }
            // Handle mahlukat death and reproduction
            let mahlukats_copy = Array.from(mahlukats);

            for(let mahlukat of mahlukats_copy){
                if(mahlukat.energy > 250){ // Reproduction! Inheritance (of speed genes) + Mutation
                    mahlukat.energy -= 100
                    let new_mahlukat = new Mahlukat(Math.random() * 100, Math.random() * 100, mahlukat.speed * (Math.random()*0.3+0.85)); // random coords, +- 0.1 around parents speed
                    mahlukats.push(new_mahlukat);
                    // I spawn the new mahlukat at a random coordinate so they dont immediately have to compete with their parents.
                }
            }
            for(let mahlukat of mahlukats){
                mahlukat.assign_target_food(foods);
                mahlukat.days_alive++;
            }

            day++;
            stats["day"] = day;
            stats["mahlukats"] = mahlukats.length;
            stats["avg_speed"] = avg_speed(mahlukats);
            average_speeds.push(avg_speed(mahlukats));
            populations.push(mahlukats.length);
            renderGraph(average_speeds, "#speed_chart");
            renderGraph(populations, "#population_chart", "Population vs. Day", "Population")
            updateStats();

            
        }
    }
    simulation_running = false;
    reset_stats();
}

function reset_stats(){
    average_speeds = [];
    mahlukats = [];
    foods = [];
    populations = [];
}
// Simulation Controller

let speedSlider = document.getElementById("simulation_speed");
let output = document.getElementById("value");
output.innerHTML = speedSlider.value;
speedSlider.oninput = function() {
    output.innerHTML = this.value;
    simulation_speed = this.value;
}
const pauserButton = document.getElementById("pauser");
pauserButton.addEventListener("click", () => {isPaused = !isPaused; console.log(isPaused)});

let simulation_speed = speedSlider.value;
const starterButton = document.getElementById("starter");
let simulation_running = false

starterButton.addEventListener("click", () => {
    if(!simulation_running) {
        let startingMahlukats = +document.getElementById("startingMahlukats").value;
        let simulationDays = +document.getElementById("simulationDays").value || 10;
        let startingFoods = +document.getElementById("startingFoods").value || 10; // Default starting values
        let replenishingFoods = +document.getElementById("replenishingFoods").value || 10;
        let startingSpeeds = +document.getElementById("startingSpeeds").value || 0.45;
        console.log(simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds);
       simulate(simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds); 
       simulation_running = true;

    }});


