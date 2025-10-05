// setting up chart
const mahlukat_tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("z-index", "9999"); 


export function renderSimulation(mahlukats, foods) {
  const width = 420;
  const height = 420;
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

  const lineGroup = svg.selectAll("g.pursuit_lines")
  .data([null])
  .join("g")
  .attr("class", "pursuit_lines");

  foodGroup.selectAll("circle")
    .data(foods)
    .join("circle")
      .attr("r", 5)
      .attr("cx", d => x(d.position_x))
      .attr("cy", d => y(d.position_y))
      .style("cursor", "pointer") 
      .on("mouseenter", function (event, d) {
      // highlight ONLY the hovered circle
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
      // show the tooltip
      mahlukat_tooltip.style("display", "block");

      lineGroup.selectAll("line").remove();

      if (foods[d].children && foods[d].children.length > 0){
        lineGroup.selectAll("line")
        .data(foods[d].children)
        .join("line")
        .attr("x1", x(foods[d].position_x))
        .attr("y1", y(foods[d].position_y))
        .attr("x2", d => x(d.position_x))
        .attr("y2", d => y(d.position_y))
        .attr("stroke", "#ee5555")
        .attr("stroke-width", "1")
        .style("stroke-opacity", "0.4");
      }
      })
      .on("mousemove", function(event, d){
        const [px, py] = d3.mouse(document.body);
      mahlukat_tooltip
      .style("left", (px+18) + "px")
      .style("top", (py+18) + "px")
      .html(`Food<br>X: ${foods[d].position_x.toFixed(2)}, Y: ${foods[d].position_y.toFixed(2)}<br>Pursuers: ${foods[d].children.length}`);
      })
      .on("mouseleave", function() {
        d3.select(this)
        .attr("stroke", null)
        .attr("stroke-width", null);
        lineGroup.selectAll("line").remove();
        mahlukat_tooltip.style("display", "none");
      
      })
      // mahlukat layer: create-or-reuse the group, then join circles to data m
  const mahlGroup = svg.selectAll("g.mahlukat")
    .data([null])
    .join("g")
      .attr("class", "mahlukat");

  mahlGroup.selectAll("circle")
    .data(mahlukats)
    .join("circle")
      .attr("r", 5)
      .attr("cx", d => x(d.position_x))
      .attr("cy", d => y(d.position_y))
      .style("cursor", "pointer") 
      .on("mouseenter", function (event, d) {
      // highlight ONLY the hovered circle
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
      // show the tooltip
      mahlukat_tooltip.style("display", "block");
      })
      .on("mousemove", function(event, d){
        const [px, py] = d3.mouse(document.body);
      mahlukat_tooltip
      .style("left", (px+18) + "px")
      .style("top", (py+18) + "px")
      .html(`Mahlukat ${mahlukats[d].name != null ? mahlukats[d].name : 'no name'}<br>X: ${mahlukats[d].position_x.toFixed(2)}, Y: ${mahlukats[d].position_y.toFixed(2)}<br>Speed: ${mahlukats[d].speed.toFixed(3)}<br>${mahlukats[d].energy != null ? "Energy: " + mahlukats[d].energy.toFixed(2) : ""}<br>${mahlukats[d].days_alive != 0 ? "Days Alive: " + mahlukats[d].days_alive :  "DA: " +  mahlukats[d].days_alive}`);
      })
      .on("mouseleave", function() {
        d3.select(this)
        .attr("stroke", null)
        .attr("stroke-width", null);
        mahlukat_tooltip.style("display", "none");
      
      })
}



let focusIndex = null;
let mouseInside = false;
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none");


export function renderGraph(data, container = "#speed_chart", title = "Average Speed vs Day", y_label = "Average Speed", x_label = "Day"){
    // set up dimensions
    const vbW = 500, vbH = 500;
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
    .text(y_label);

    g.append("text")
    .attr("y", height + margin.bottom - 6)
    .attr("x", width/2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#777")
    .text(x_label);

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
    .html(`Day: ${focusIndex}<br>${y_label}: ${data[focusIndex].toFixed(3)}`);
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
    .html(`<text>Day: ${i}<br>${y_label}: ${d.toFixed(3)}</text>`);
        })

    listeningRectangle.on("mouseleave", function () {
    circle.attr("r", 0);
    mouseInside = false;
    tooltip.style("display", "none");  });  

}