import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  
  let data = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  
  let arcs = arcData.map((d) => arcGenerator(d));
  
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();
  
  arcs.forEach((arc, idx) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx));
  });
  
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`) 
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); 
  });
}

renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  
  renderProjects(filteredProjects, projectsContainer, 'h2');
  
  renderPieChart(filteredProjects);
});