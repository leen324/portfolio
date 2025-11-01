import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let query = '';
let selectedIndex = -1;

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
  
  arcs.forEach((arc, i) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', 'pie-slice')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        
        newSVG.selectAll('path')
            .attr('class', (_, idx) =>
                idx === selectedIndex ? 'selected pie-slice' : 'pie-slice'
            );

        legend
          .selectAll('li')
          .attr('class', (_, idx) =>
            idx === selectedIndex ? 'selected legend-item' : 'legend-item'
          );

        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2')
        } else {
            let selectedYear = data[selectedIndex].label;
            let filtered = projects.filter((p) => p.year === selectedYear);
            renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
  
  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(i)}`) 
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`) 
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        newSVG
          .selectAll('path')
          .attr('class', (_, idx) =>
            idx === selectedIndex ? 'selected pie-slice' : 'pie-slice'
          );

        legend
          .selectAll('li')
          .attr('class', (_, idx) =>
            idx === selectedIndex ? 'selected legend-item' : 'legend-item'
          );

        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          let selectedYear = data[selectedIndex].label;
          let filtered = projects.filter(
            (p) => p.year === selectedYear
          );
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
}


renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  selectedIndex = -1;
  
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  
  renderProjects(filteredProjects, projectsContainer, 'h2');
  
  renderPieChart(filteredProjects);
});