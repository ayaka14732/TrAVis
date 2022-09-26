const visualiserID = '#my_dataviz';

/**
 * @param {number[][]} rawData
 */
const visualiserRun = (rawData, tokens) => {
  // set the dimensions and margins of the graph
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  let length = Math.min(windowWidth * 0.7, windowHeight * 0.6);
  const margin = { top: 80, right: 0, bottom: 0, left: 80 };
  if (windowWidth < 768) {
    length = Math.min(windowWidth * 0.9, windowHeight * 0.6);
    margin.left = 60;
  }
  const width = length - margin.left - margin.right;
  const height = length - margin.top - margin.bottom;

  const data = prepareData(rawData, tokens);
  const svg = visualiserInitialiseHeatmap(width, height, margin);
  const [xScale, yScale, colorScale] = visualiserBuildScale(
    svg,
    width,
    height,
    Array.from(new Set(data.map((d) => d.layerTo))),
    Array.from(new Set(data.map((d) => d.layerFrom))),
    tokens
  );

  const [mouseover, mousemove, mouseleave] = visualiserCreateTooltip();

  visualiserVisualise(
    svg,
    data,
    xScale,
    yScale,
    colorScale,
    mouseover,
    mousemove,
    mouseleave
  );
};

/**
 * @param {number[][]} rawData
 * @return {{layerFrom: number, layerTo: number, attention: number}[]} parsedData
 */
const prepareData = (rawData) => {
  const parsedData = [];

  rawData.forEach((data, index) => {
    data.forEach((attention, i) => {
      parsedData.push({
        layerFrom: index,
        layerTo: i,
        attention,
      });
    });
  });

  return parsedData;
};

/**
 * @param {number} width
 * @param {number} height
 * @param {number} margin
 */
const visualiserInitialiseHeatmap = (width, height, margin) => {
  document.querySelector(visualiserID).innerHTML = '';

  // append the svg object to the body of the page
  const svg = d3
    .select(visualiserID)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  return svg;
};

/**
 * @param {number} width
 * @param {number} height
 * @param {number[]} xValues
 * @param {number[]} yValues
 * @param {string[]} tokens
 */
const visualiserBuildScale = (svg, width, height, xValues, yValues, tokens) => {
  // Build X scales and axis:
  const xScale = d3.scaleBand().range([0, width]).domain(xValues);

  svg
    .append('g')
    .style('font-size', 15)
    .call(
      d3
        .axisTop(xScale)
        .tickSize(0)
        .tickFormat((x) => tokens[x])
    )
    .selectAll('text')
    .attr('font-family', 'Times')
    .attr('transform', 'rotate(45)')
    .style('text-anchor', 'end');
  svg.select('.domain').remove();

  // Build Y scales and axis:
  const yScale = d3.scaleBand().range([0, height]).domain(yValues);
  svg
    .append('g')
    .style('font-size', 15)
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(0)
        .tickFormat((y) => tokens[y])
    )
    .selectAll('text')
    .attr('font-family', 'Times');
  svg.select('.domain').remove();

  // Build color scale
  const maximum = 1;
  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateYlGnBu)
    .domain([0, maximum]);

  return [xScale, yScale, colorScale];
};

const visualiserCreateTooltip = () => {
  // create a tooltip
  const tooltip = d3
    .select('visualiserID')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px');

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = (event, d) => {
    tooltip.style('opacity', 1);
    d3.select(this).style('stroke', 'black').style('opacity', 1);
  };
  const mousemove = (event, d) => {
    tooltip
      .html('The exact value of<br>this cell is: ' + d.value)
      .style('left', event.x / 2 + 'px')
      .style('top', event.y / 2 + 'px');
  };
  const mouseleave = (event, d) => {
    tooltip.style('opacity', 0);
    d3.select(this).style('stroke', 'none').style('opacity', 0.8);
  };

  return [mouseover, mousemove, mouseleave];
};

/**
 * @param {{layerFrom: number, layerTo: number, attention: number}} data
 */
const visualiserVisualise = (
  svg,
  data,
  xScale,
  yScale,
  colorScale,
  mouseover,
  mousemove,
  mouseleave
) => {
  svg
    .selectAll()
    .data(data, (d) => d.layerFrom + ':' + d.layerTo)
    .join('rect')
    .attr('x', (d) => xScale(d.layerTo))
    .attr('y', (d) => yScale(d.layerFrom))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .style('fill', (d) => colorScale(d.attention))
    .style('stroke-width', 4)
    .style('stroke', 'none')
    .style('opacity', 0.8);
  // .on('mouseover', mouseover)
  // .on('mousemove', mousemove)
  // .on('mouseleave', mouseleave);
};
