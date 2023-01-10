const svg = d3.select("svg#map");
const map_legend = d3.select("#map_legend");
const width = svg.attr("width");
const height = svg.attr("height");
const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const mapWidth = width - margin.left - margin.right;
const mapHeight = height - margin.top - margin.bottom;
const map = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create an async function to load data and build the map
const drawMap = async function () {
  const us = await d3.json('States of US.json');
  const unemplymentRate = await d3.csv("State unemployment rate 12-month change.csv", d3.autoType);

  let stateNames = {};  // name of state
  let unemployment_rate_2021 = {}; // The rate of unemployment on October, 2021
  let unemployment_rate_2022 = {}; // The rate of unemployment on October, 2022
  let change_rate = {};   // The change of unemployment rate

  unemplymentRate.forEach(row => {
    stateNames[row.state_code] = row.State;
    unemployment_rate_2021[row.state_code] = Number(row.October_2021_unemployment_rate)
    unemployment_rate_2022[row.state_code] = Number(row.October_2022_unemployment_rate)
    change_rate[row.state_code] = Number(row.change_12_month)
  })

  let states = topojson.feature(us, us.objects.states);
  let statesMesh = topojson.mesh(us, us.objects.states);
  let projection = d3.geoAlbersUsa().fitSize([mapWidth, mapHeight], states);
  let path = d3.geoPath().projection(projection);
  
  // Add a graticule
  let graticule = d3.geoGraticule10();
  map.append("path").attr("class", "graticule").attr("d", path(graticule))

  const colorScale = d3.scaleQuantize()
                      .domain(Object.values(unemployment_rate_2022))
                      .range(["#b6e9e1",
                        "#a8ddb5",
                        "#9fe0ff",
                        "#d5e2a3",
                        "#a6bddb",]);

  // Draw states and outlines
  let statePaths = map.selectAll("path.state").data(states.features)
    .join("path")
    .attr("class", "state")
    .attr('note', d => d.id)
    .attr("d", path)
    .on('mouseover', mouseEntersPlot)
    .on('mouseout', mouseLeavesPlot);

  map.append("path").datum(statesMesh)
    .attr("class", "outline")
    .attr("d", path);

  // Draw legend
  draw_legend(map_legend, colorScale);

  map.selectAll(".state")
    .style("fill", d => colorScale(unemployment_rate_2022[d.id]));

  // three labels that will be shown
  let label1 = ["October_2022_unemployment_rate"];
  let label2 = ["change_12_month"]
  let label3 = ["October_2021_unemployment_rate"]

  // Map Hover
  // Add a tooltop that will stick below the state label
  const tooltipWidth = 260;
  const tooltipHeight = 110;

  let momesh = map.append("path")
                  .attr("class", "mouseover outline")
                  .style("stroke", "black")
                  .style("stroke-width", 1.5)
                  .attr("d", "");

  let tooltip = map.append("g")
                  .attr("class", "tooltip")
                  .attr("visibility", "hidden");

  tooltip.append('rect')
          .attr('fill', 'black')
          .attr('opacity', 0.7)
          .attr('x', -tooltipWidth / 2.0)
          .attr('y', 0)
          .attr('width', tooltipWidth)
          .attr('height', tooltipHeight);

  let state_label = tooltip.append("text")
                          .attr("fill", "white")
                          .attr("text-anchor", "middle")
                          .style("font-family", "sans-serif")
                          .style("font-size", "20px")
                          .attr("alignment-baseline", "hanging")
                          .attr("x", 0)
                          .attr("y", 15);

  label1.forEach((d, i) => {
    tooltip.append("text")
      .attr("id", d)
      .attr("x", 0)
      .attr("y", 40 + 15 * i)
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "12px")
      .attr('alignment-baseline', 'hanging')
      .attr('fill', 'white')
      .text("");
  })
  label2.forEach((d, i) => {
    tooltip.append("text")
      .attr("id", d)
      .attr("x", 0)
      .attr("y", 60 + 15 * i)
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "12px")
      .attr('alignment-baseline', 'hanging')
      .attr('fill', 'white')
      .text("");
  })
  label3.forEach((d, i) => {
    tooltip.append("text")
      .attr("id", d)
      .attr("x", 0)
      .attr("y", 80 + 15 * i)
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "12px")
      .attr('alignment-baseline', 'hanging')
      .attr('fill', 'white')
      .text("");
  })

  function mouseEntersPlot() {
    tooltip.style('visibility', 'visible');
    let state = d3.select(this);

    //name of the state and label it
    let stateName = state.datum().id;
    state_label.text(stateNames[stateName]);
    
    // Get three labels
    label1.forEach(function (d) {
      d3.selectAll("text#" + d)
        .text("October 2021 unemployment rate" + ": " + unemployment_rate_2021[stateName]+"%");
    });

    label2.forEach(function (d) {
      d3.selectAll("text#" + d)
        .text("October 2022 unemployment rate" + ": " + unemployment_rate_2022[stateName]+"%");
    });

    label3.forEach(function (d) {
      d3.selectAll("text#" + d)
        .text("12-month change" + ": " + change_rate[stateName]+"%");
    });

    let bounds = path.bounds(state.datum());
    let xPos = (bounds[0][0] + bounds[1][0]) / 2.0;
    let yPos = bounds[1][1] > 500? 500: bounds[1][1]- 15;

    tooltip.attr('transform', `translate(${xPos},${yPos})`);

    var mo = topojson.mesh(us, us.objects.states, function (a, b) {
      return a.id === stateName || b.id === stateName;
    });
    momesh.datum(mo).attr('d', path);
  }

  // leave state, hide selected state outline
  function mouseLeavesPlot() {
    tooltip.style('visibility', 'hidden');
    momesh.attr('d', '');
  }

  // draw legend
  function draw_legend(legend, legendColorScale) {
    const legend_width = legend.attr('width');
    const legend_height = legend.attr('height');
    const legend_MinMax = d3.extent(legendColorScale.domain());
    const bar_height = 45;
    const step_size = 4;

    const pixel_scale = d3.scaleLinear()
                          .domain([0, legend_width - 35])
                          .range([legend_MinMax[0] - 1, legend_MinMax[1] + 1]);

    const bar_scale = d3.scaleLinear()
                        .domain([legend_MinMax[0] - 1, legend_MinMax[1] + 1])
                        .range([0, legend_width - 35]);
    const bar_axis = d3.axisBottom(bar_scale).tickFormat(d =>d+"%");

    if (legendColorScale.hasOwnProperty('quantiles')) {
      bar_axis.tickValues(legendColorScale.quantiles().concat(legend_MinMax));
    }
    legend.append('g')
          .attr('class', 'colorbar axis')
          .attr('transform', 'translate(' + 20 + ',' + (bar_height + 5) + ')')
          .call(bar_axis);
    legend.append('text')
          .text("Oct 22 Unemploymnet Rate")
          .attr('class', 'label')
          .attr("text-anchor", 'end')
          .attr('transform', `translate(${legend_width},${legend_height})`);

    let bar = legend.append('g')
                    .attr('transform', 'translate(' + 20 + ',' + 0 + ')');
    
    for (let i = 0; i < legend_width - 35; i = i + step_size) {
      bar.append('rect')
          .attr('x', i)
          .attr('y', 0)
          .attr('width', step_size)
          .attr('height', bar_height)
          .style('fill', legendColorScale(pixel_scale(i)));
    }
  }

}
drawMap()
