import { renderSimulation, renderGraph } from "./render.js";
import { read_input } from "./utils.js";
import { ProtoMahlukat, Food } from "./classes.js"; 

class PredatorMahlukat extends ProtoMahlukat{
    constructor(x, y, speed){
        super(x, y, speed);
        this.energy = 200;
        this.days_alive = 0;
        this.target_food = null;
    }

    assign_target_food(food_list){
        let min_idx = super.assign_target_food(food_list, true);
        this.target_food = food_list[min_idx];
    }

    travel_towards(target_x, target_y){
        super.travel_towards(target_x, target_y);

        this.energy -= (this.speed**2);
        if (this.energy <= 0 ||  this.days_alive > 15){
            mahlukats.splice(mahlukats.indexOf(this) , 1);
            if(this.target_food) {this.target_food.children.splice(this.target_food.children.indexOf(this), 1); }
            this.target_food = null;
            return;
        }
    }
}
class PreyMahlukat extends ProtoMahlukat{
    constructor(x, y, speed){
        super(x, y, speed);
        this.children = [];
        this.energy = 200;
        this.days_alive = 0;
        this.target_food = null;
    }

    assign_target_food(food_list){
    let min_idx = super.assign_target_food(food_list, true);
    this.target_food = food_list[min_idx];
    }

    travel_towards(target_x, target_y){
        super.travel_towards(target_x, target_y);

        this.energy -= (this.speed**2);
        if (this.energy <= 0 ||  this.days_alive > 15){
            mahlukats.splice(mahlukats.indexOf(this) , 1);
            if(this.target_food) {this.target_food.children.splice(this.target_food.children.indexOf(this), 1); }
            this.target_food = null;
            return;
        }
    }
    
    find_closest_child(){
        if(this.children.length === 0){
            return null;
        }
        let current_min_distance = Infinity;
        let closest_predator = null;
        for(let predator of this.children){
            let current_dist = predator.find_dist(this.position_x, this.position_y);
            if(current_dist < current_min_distance){
                current_min_distance = current_dist;
                closest_predator = predator;
            }
        }
        return closest_predator;
    }   
}


let mahlukats = [];
let predators = [];
let foods = [];
let stats = {day: 1}
let average_speeds = []
let mahlukat_populations = [];
let predator_populations = [];

function initiate_entities(number_of_foods, number_of_mahlukat, number_of_predators){
    for(let i = 0; i < number_of_mahlukat; i++){
        let new_mahlukat = new PreyMahlukat(Math.random() * 100, Math.random() * 100, (Math.random() * 0.5) + 0.2); // 0-100, 0-100, 0.2-0.7
        mahlukats.push(new_mahlukat);
    }
    for(let i = 0; i < number_of_predators; i++){
        let new_predator = new PredatorMahlukat(Math.random() * 100, Math.random() * 100, (Math.random() * 0.1) + 0.5); // 0-100, 0-100, 0.2-0.7
        predators.push(new_predator);
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

function update_stats() {
  const stats_element = document.getElementById('stats');
  if (stats_element){
      stats_element.textContent = `Day: ${stats.day} | Mahlukats: ${mahlukats.length != 0 ? mahlukats.length : stats.mahlukats} | Avg speed: ${stats.avg_speed.toFixed(3)}`;
  }
}

let isPaused = false;
async function simulate(simulation_length, startingMahlukats, startingPredators, startingFoods, replenishing_food_count){

    initiate_entities(startingFoods, startingMahlukats, startingPredators);
    stats["mahlukats"] = startingMahlukats;
    stats["predators"] = startingPredators;
    stats["avg_speed"] = avg_speed(mahlukats);
    update_stats();
    let data = [];

    let delta_time = 0;
    let day = 1;
    let time_interval = 1;

    for(let mahlukat of mahlukats){ 
        mahlukat.assign_target_food(foods); 
    }
    for(let predator of predators){
        if(mahlukats.length < 1){
            break;
        }
        predator.assign_target_food(mahlukats);
    }

    while (day <= simulation_length){

        while(isPaused){
            await sleep(10);
        }
        let foods_copy = Array.from(foods);
        
        if (mahlukats.length == 0) {
            document.getElementById("debug").textContent = "Simulation Over! All mahlukats died.";
            simulation_running = false;
        }

        for(let food of foods_copy){ // iterate over each food and its pursues to improve efficiency compared to checking every mahlukat for every food
            if(food.children.length == 0){
                continue;
            }
            let closest_child = food.find_closest_child();
            if(!closest_child){
                continue;
            }
            let food_to_child_distance = (closest_child.find_dist(food.position_x, food.position_y)) ** 0.5;
            let travel_distance = time_interval * closest_child.speed;
            // check if the closest child will reach the food.

            for(let mahlukat of food.children){
                mahlukat.travel_towards(food.position_x, food.position_y);
            }
            if(travel_distance > food_to_child_distance){
                [closest_child.position_x, closest_child.position_y] = [food.position_x, food.position_y];
                foods.splice(foods.indexOf(food), 1);
                closest_child.energy += 200;
                
                if(closest_child.energy > 250){ 
                closest_child.energy -= 100
                let new_mahlukat = new PreyMahlukat(Math.random() * 100, Math.random() * 100, closest_child.speed);    
                mahlukats.push(new_mahlukat);
                new_mahlukat.assign_target_food(foods);
                }

                if(foods.length > 0){
                    for(let mahlukat of food.children){
                        mahlukat.assign_target_food(foods);
                    }
                }

            }
        }
        let mahlukats_copy = Array.from(mahlukats);
        for(let mahlukat of mahlukats_copy){
            let closest_child = mahlukat.find_closest_child();
            if(!closest_child){
                continue;
            }
            let mahlukat_to_child_distance = (closest_child.find_dist(mahlukat.position_x, mahlukat.position_y)) ** 0.5;
            let travel_distance = time_interval * closest_child.speed;

            for(let predator of mahlukat.children){
                predator.travel_towards(mahlukat.position_x, mahlukat.position_y);
            }
            if(travel_distance > mahlukat_to_child_distance){ // predators eating mahlukats!
                [closest_child.position_x, closest_child.position_y] = [mahlukat.position_x, mahlukat.position_y];
                
                mahlukats.splice(mahlukats.indexOf(mahlukat), 1);
                closest_child.energy += 200;

                // remove mahlukat from mahlukats list...

                mahlukat.target_food.children.splice(mahlukat.target_food.children.indexOf(mahlukat), 1);
                mahlukat.target_food = null;
                // remove mahlukat from food pursuer list
            
                if(mahlukats.length > 0){
                    for(let predator of Array.from(mahlukat.children)){
                        predator.assign_target_food(mahlukats);
                    }
                }
            }
        }

        document.getElementById("debug").textContent = "Simulated Frames: " + delta_time;
        delta_time++;
        update_stats();
        await sleep(1000/simulation_speed);
        renderSimulation(mahlukats, foods, predators);

        if(foods.length == 0){ // End of day
            for(let i = 0; i < replenishing_food_count; i++){ // Replenish food
                let new_food = new Food(Math.random() * 100, Math.random() * 100);
                foods.push(new_food);
            }

            // reassigning food MAHLUKATS
            for(let mahlukat of mahlukats){
                mahlukat.assign_target_food(foods);
                mahlukat.children = [];  // this code is so fragile it is insane i hope it works
            }
         
            let predators_copy = Array.from(predators)
            // predator reproduction
            for(let predator of predators_copy){
                if(predator.energy > 250){ 
                    predator.energy -= 100
                    let new_predator = new PredatorMahlukat(Math.random() * 100, Math.random() * 100, predator.speed);
                    predators.push(new_predator);
                    }
                }
            
            // assigning food for PREDATORS
            for(let predator of predators){
                predator.assign_target_food(mahlukats)
            }

            day++;
            stats["day"] = day;
            stats["mahlukats"] = mahlukats.length;
            stats["avg_speed"] = avg_speed(mahlukats);
            average_speeds.push(avg_speed(mahlukats));
            mahlukat_populations.push(mahlukats.length);
            predator_populations.push(predators.length);
            renderGraph(mahlukat_populations, "#mahlukat_population_chart", "Mahlukat Population vs Day", "Mahlukats");
            renderGraph(predator_populations, "#predator_population_chart", "Predator Population vs Day", "Predators");
            update_stats();

            
        }
    }
    simulation_running = false;
    average_speeds = [];
    mahlukats = [];
    foods = [];
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
pauserButton.addEventListener("click", () => {isPaused = !isPaused});

let simulation_speed = speedSlider.value;
const starterButton = document.getElementById("starter");
let simulation_running = false

const input_form = document.querySelector(".input_row");

starterButton.addEventListener("click", () => {
    if(!simulation_running) {
        if (input_form && !input_form.reportValidity()){
            return;
        }
        let startingMahlukats = read_input("startingMahlukats", 10) 
        let simulationDays = read_input("simulationDays", 10);
        let startingFoods = read_input("startingFoods", 10); // Default starting values
        let replenishingFoods = read_input("replenishingFoods", 10);
        let startingSpeeds = read_input("startingSpeeds", 0.5);
        console.log(simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds);
        simulate(simulationDays, startingMahlukats, 10, startingFoods, replenishingFoods, startingSpeeds); 
        simulation_running = true;
    }});



