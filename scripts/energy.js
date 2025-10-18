import { renderSimulation, renderGraph } from "./render.js";
import { read_input } from "./utils.js";
import { ProtoMahlukat, Food } from "./classes.js";

class EnergyMahlukat extends ProtoMahlukat{

    constructor(x, y, speed){
        super(x, y, speed);
        this.energy = 200;
        this.days_alive = 0;
        this.target_food = null;
    }


    assign_target_food(food_list){
        let min_idx = super.assign_target_food(food_list);
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

let mahlukats = [];
let foods = [];
let stats = { day : 1 };
let average_speeds = [];
let populations = [];

function initiate_entities(number_of_foods, number_of_mahlukat, starting_speeds){
    for(let i = 0; i < number_of_mahlukat; i++){
        let new_mahlukat = new EnergyMahlukat(Math.random() * 100, Math.random() * 100, starting_speeds * (Math.random() * 1.0 + 0.5)); // random coordinates, up to 50% deviation from avg starting speed
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

function update_stats() {
  const stats_element = document.getElementById('stats');
  if (stats_element){
      stats_element.textContent = `Day: ${stats.day} | Mahlukats: ${mahlukats.length != 0 ? mahlukats.length : stats.mahlukats} | Avg speed: ${stats.avg_speed.toFixed(3)}`;
  }
}

let isPaused = false;
async function simulate(simulation_length, startingMahlukats = 10, startingFoods = 10, replenishing_food_count = 10, starting_speeds = 0.45){
    initiate_entities(startingFoods, startingMahlukats, starting_speeds);
    stats["mahlukats"] = startingMahlukats;
    stats["avg_speed"] = avg_speed(mahlukats);
    update_stats();
    let data = [];

    let delta_time = 0;
    let day = 1;
    let time_interval = 1;

    for(let mahlukat of mahlukats){ 
        mahlukat.assign_target_food(foods); 
    }

    while (day <= simulation_length){

        let tick_starting = (Date.now() + performance.now());
        // no mahlukats left?
        if (mahlukats.length == 0) {
            document.getElementById("debug").textContent = "Simulation Over! All mahlukats died.";
            simulation_running = false;
            reset_stats();
            return;
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
        update_stats();
        let time_elapsed = (((Date.now() + performance.now() - tick_starting).toFixed(3)) + "ms");

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
                    let new_mahlukat = new EnergyMahlukat(Math.random() * 100, Math.random() * 100, mahlukat.speed * (1 + (Math.random() * 0.3 - 0.15) * mutationAmplifier)); // tehe speed formula is +-15% around parent multiplied by amplificaiton
                    // I spawn the new mahlukat at a random coordinate so they dont immediately have to compete with their parents.
                    mahlukats.push(new_mahlukat);

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
            update_stats();

            
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

const speedSlider = document.getElementById("simulation_speed");
let output = document.getElementById("value");
output.innerHTML = speedSlider.value;
speedSlider.oninput = function() {
    output.innerHTML = this.value;
    simulation_speed = this.value;
}
const pauserButton = document.getElementById("pauser");
pauserButton.addEventListener("click", () => {isPaused = !isPaused});



let simulation_speed = +speedSlider.value;
const starterButton = document.getElementById("starter");
let simulation_running = false
const starting_input_form = document.querySelector(".input_row");

starterButton.addEventListener("click", () => {
    if(!simulation_running) {
        if (starting_input_form && !starting_input_form.reportValidity()){
            return;
        }
        let startingMahlukats = read_input("startingMahlukats", 10) 
        let simulationDays = read_input("simulationDays", 10);
        let startingFoods = read_input("startingFoods", 10); // Default starting values
        let replenishingFoods = read_input("replenishingFoods", 10);
        let startingSpeeds = read_input("startingSpeeds", 0.5);
        console.log("simulation starting with settings: " + simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds);
       simulate(simulationDays, startingMahlukats, startingFoods, replenishingFoods, startingSpeeds); 
       simulation_running = true;

    }});


const mutation_amp_input = document.getElementById("mutationAmplifier");
let mutation_amplifier = read_input("mutationAmplifier", 1);
mutation_amp_input.addEventListener('input', () => {
  if (!mutationInput.reportValidity()) return;
  mutation_amplifier = mutation_amp_input.valueAsNumber; // numeric, not string
});