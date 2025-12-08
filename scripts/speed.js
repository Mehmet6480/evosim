import { renderSimulation, renderGraph } from "./render.js";
import { read_input, attach_config_exporter } from "./utils.js";
import { ProtoMahlukat, Food } from "./classes.js"; 

export class SpeedMahlukat extends ProtoMahlukat{
    
    constructor(x, y, speed){
        super(x, y, speed);
        this.eaten_today = false;
    }
}


let mahlukats = [];
let living_mahlukats = [];
let foods = [];
let stats = {day: 1}
let average_speeds = []

function initiate_entities(number_of_foods, number_of_mahlukat){
    for(let i = 0; i < number_of_mahlukat; i++){
        let new_mahlukat = new SpeedMahlukat(Math.random() * 100, Math.random() * 100, (Math.random() * 0.5) + 0.2); // 0-100, 0-100, 0.2-0.7
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
async function simulate(simulation_length, startingMahlukats, startingFoods, replenishing_food_count){
    initiate_entities(startingFoods, startingMahlukats);
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

        while(isPaused){
            await sleep(10);
        }
        let foods_copy = Array.from(foods);
        
        if (mahlukats.length == 0) {
            document.getElementById("debug").textContent = "Simulated Over! All mahlukats died.";
            simulation_running = false;

        }

        for(let food of foods_copy){ // iterate over each food and its pursues to improve efficiency compared to checking every mahlukat for every food
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
                closest_child.eaten_today = true;

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
            for(let mahlukat of mahlukats_copy){ // Death
               if(!mahlukat.eaten_today){
                    mahlukats.splice(mahlukats.indexOf(mahlukat) , 1);
               }
            }

            for(let mahlukat of mahlukats_copy){
                if(mahlukat.eaten_today){ // Reproduction! Inheritance (of speed genes) + Mutation
                    let new_mahlukat = new SpeedMahlukat(Math.random() * 100, Math.random() * 100, mahlukat.speed + (Math.random() - 0.5)*0.2); // random coords, +- 0.1 around parents speed
                    mahlukats.push(new_mahlukat);
                    // I spawn the new mahlukat at a random coordinate so they dont immediately have to compete with their parents.
                }
                mahlukat.eaten_today = false;
            }
            for(let mahlukat of mahlukats){
                mahlukat.assign_target_food(foods);
            }

            day++;
            stats["day"] = day;
            stats["mahlukats"] = mahlukats.length;
            stats["avg_speed"] = avg_speed(mahlukats);
            average_speeds.push(avg_speed(mahlukats));
            renderGraph(average_speeds, "#speed_chart");
            updateStats();

            
        }
    }
    simulation_running = false;
    average_speeds = [];
    mahlukats = [];
    foods = [];
}

// Simulation Controller

let speedSlider = document.getElementById("simulationSpeed");
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

const input_form = document.querySelector(".input_row");

attach_config_exporter("exportConfig",["simulationDays", "startingMahlukats", "startingFoods", "replenishingFoods", "startingSpeeds", "mutationAmplifier"],"configStatus");

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
        simulate(simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds); 
        simulation_running = true;
    }});



