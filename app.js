class Mahlukat{
    position_x;
    position_y;
    speed;

    constructor(x, y, speed){
        this.position_x = x;
        this.position_y = y;
        this.speed = speed;
        this.eaten_today = false;
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
let living_mahlukats = [];
let foods = [];
let stats = {day: 1}
let average_speeds = []

function initiate_entities(number_of_foods, number_of_mahlukat){
    for(let i = 0; i < number_of_mahlukat; i++){
        let new_mahlukat = new Mahlukat(Math.random() * 100, Math.random() * 100, (Math.random() * 0.5) + 0.2); // 0-100, 0-100, 0.2-0.7
        mahlukats.push(new_mahlukat);
    }
    for(let i = 0; i < number_of_foods; i++){
        let new_food = new Food(Math.random() * 100, Math.random() * 100); // 0-100, 0-100, []
        foods.push(new_food);
    }
}


function console_display(){
    let grid = Array.from({length: 40}, () => Array(40).fill("_ "));

    for(let mahlukat of mahlukats){
        let x_index = Math.round(mahlukat.position_x / 2.5);
        let y_index = Math.round(mahlukat.position_y / 2.5);

        grid[y_index][x_index] = "X ";
    }
    for(let food of foods){
        let x_index = Math.round(food.position_x / 2.5);
        let y_index = Math.round(food.position_y / 2.5);

        grid[y_index][x_index] = "O ";
    }

    for(let row of grid){
        let row_str = ""
        for(let chr of row){
            row_str += chr
        }
    console.log(row_str);
    }
}


// setting up chart
function renderSimulation(m, f) {
  const width = 500;
  const height = 500;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  // scales
  const x = d3.scaleLinear().domain([-2, 100]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([-2, 100]).range([height - margin.bottom, margin.top]);

  // root svg (ensure size once)
  const svg = d3.select("#simulation_chart")
    .selectAll("svg")
    .data([null])
    .join("svg")
      .attr("width", width)
      .attr("height", height);

  // axes: use a single-bound “data([null]).join('g')” trick to create-or-reuse
  svg.selectAll(".x-axis")
    .data([null])
    .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

  svg.selectAll(".y-axis")
    .data([null])
    .join("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));


  // food layer
  const foodGroup = svg.selectAll("g.food")
    .data([null])
    .join("g")
      .attr("class", "food");

  foodGroup.selectAll("circle")
    .data(f)
    .join("circle")
      .attr("r", 6)
      .attr("cx", d => x(d.position_x))
      .attr("cy", d => y(d.position_y));

      // mahlukat layer: create-or-reuse the group, then join circles to data m
  const mahlGroup = svg.selectAll("g.mahlukat")
    .data([null])
    .join("g")
      .attr("class", "mahlukat");

  mahlGroup.selectAll("circle")
    .data(m)
    .join("circle")
      .attr("r", 6)
      .attr("cx", d => x(d.position_x))
      .attr("cy", d => y(d.position_y));

}

let focusIndex = null;
let mouseInside = false;
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none");

function renderGraph(data, container = "#speed_chart", title = "Average Speed vs Day"){
    // set up dimensions
    const vbW = 600, vbH = 600;
    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width  = vbW - margin.left - margin.right;
    const height = vbH - margin.top - margin.bottom;



    // put svg in chart container
    const root = d3.select(container);
    root.selectAll("*").remove();

    const svg = root.append("svg")
    .attr("class", "chart")           
    .attr("viewBox", `0 0 ${vbW} ${vbH}`);
    

    const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // set up x y scales
    // define x y domains
    const x = d3.scaleLinear()
    .domain([0, Math.max(0, data.length-1)])
    .nice()
    .range([0,width]);

    const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d)])
    .nice()
    .range([height,0]);

    // configure x axis
    const xAxis = d3.axisBottom(x)
        .ticks(4)
        .tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y)
        .ticks(10);

    // add the x y axis

    g.append("g")
    .attr("transform", `translate(0,${height})`)
    .style("font-size", "14px")
    .call(xAxis)
    .call(g => g.select(".domain").remove())
    .selectAll(".tick line")
    .style("stroke-opacity", 0)

    g.append("g")
    .style("font-size", "14px")
    .call(yAxis
        .tickSize(0)
        .tickPadding(10)
    )
    .call(g => g.select(".domain").remove());

    if(data.length == 0){ return; }
    
    // vertical gridlines
    g.selectAll("xGrid")
    .data(x.ticks().slice(1))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#d0d0d0")
    .attr("stroke-width", .5);

    // horizontal gridlines

    g.selectAll("yGrid")
    .data(y.ticks().slice(1))
    .join("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#d0d0d0")
    .attr("stroke-width", .4);

    // title
    g.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("text-anchor", "middle")
    .attr("y", margin.top - 50)
    .style("font-size", "16px")
    .text(title);

    // axis labels

    g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#777")
    .text("Average Speed");

    g.append("text")
    .attr("y", height + margin.bottom - 6)
    .attr("x", width/2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#777")
    .text("Days");

    // make the line generator
    const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d));

    
    
    // add the line to the svg element
    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);


    
    const circle = g.append("circle")
    .attr("r", 0)
    .attr("fill", "steelblue")
    .style("stroke", "white")
    .attr("opacity", .7)
    .style("pointer-events", "none");

    if (mouseInside && focusIndex !== null && data[focusIndex] != null) { // stop nuking the old circle 
    circle
    .attr("cx", x(focusIndex))
    .attr("cy", y(data[focusIndex]))
    .attr("r", 6);

    const fx = x(focusIndex);
    const fy = y(data[focusIndex]);
    const svgNode = svg.node();
    const pt = svgNode.createSVGPoint();
    pt.x = fx; pt.y = fy;
    const screenPoint = pt.matrixTransform(svgNode.getScreenCTM());

    tooltip
    .style("display", "block")
    .style("left",  (screenPoint.x + 49) + "px")  // small offset
    .style("top",   (screenPoint.y + 33) + "px")
    .html(`Day: ${focusIndex}<br>Average Speed: ${data[focusIndex].toFixed(3)}`);
    }
    
    const listeningRectangle = g.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

    listeningRectangle
    .on("mouseenter", () => {mouseInside = true;})
    .on("mousemove", function (event) {
        const [xCoordinate] = d3.mouse(this);
        const x0 = x.invert(xCoordinate);
        const i = Math.max(0, Math.min(data.length - 1, Math.round(x0))); // <-- clamp
        const d = data[i]
        const finalX = x(i)
        const finalY = y(d)
    
    
    circle.attr("cx", finalX).attr("cy", finalY);
    circle.attr("r", 6)
    focusIndex = i;


    const svgNode = svg.node();
    const pt = svgNode.createSVGPoint();
    pt.x = finalX;
    pt.y = finalY;
    const screenPoint = pt.matrixTransform(svgNode.getScreenCTM());
    tooltip
    .style("display", "block")
    .style("left", `${screenPoint.x + 49}px`)
    .style("top", `${screenPoint.y + 33}px`)
    .html(`<text>Day: ${i}<br>Average Speed: ${d.toFixed(3)}</text>`)
        })

    listeningRectangle.on("mouseleave", function () {
    circle.attr("r", 0);
    mouseInside = false;
    tooltip.style("display", "none");  });  

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
    initiate_entities(5, 5);
    stats["mahlukats"] = 5;
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
        await sleep(1000/simulationSpeed);
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
                    let new_mahlukat = new Mahlukat(Math.random() * 100, Math.random() * 100, mahlukat.speed + (Math.random() - 0.5)*0.2); // random coords, +- 0.1 around parents speed
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
    simulationRunning = false;
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
    simulationSpeed = this.value;
}
const pauserButton = document.getElementById("pauser");
pauserButton.addEventListener("click", () => {isPaused = !isPaused; console.log(isPaused)});

let simulationSpeed = speedSlider.value;
const starterButton = document.getElementById("starter");
let simulationRunning = false

starterButton.addEventListener("click", () => {
    if(!simulationRunning) {
        let startingMahlukats = +document.getElementById("startingMahlukats").value;
        let simulationDays = +document.getElementById("simulationDays").value || 10;
        let startingFoods = +document.getElementById("startingFoods").value || 10;
        let replenishingFoods = +document.getElementById("replenishingFoods").value || 10;
        console.log(simulationDays, startingMahlukats, startingFoods, replenishingFoods);
       simulate(simulationDays, startingMahlukats, startingFoods, replenishingFoods); 
       simulationRunning = true;

    }});


