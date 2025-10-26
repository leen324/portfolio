import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// export function renderProjects(projects, containerElement, headingLevel = 'h2') {
//   // Your code will go here
//   containerElement.innerHTML = '';

//   projects.forEach(project => {
//     const article = document.createElement('article');
//     article.innerHTML = `
//         <h3>${project.title}</h3>
//         <img src="${project.image}" alt="${project.title}">
//         <p>${project.description}</p>
//         ;
//     containerElement.appendChild(article);
//   });
//   }
  
// export function renderProjects(projects, containerElement, headingLevel = 'h2') {
// // Your code will go here
//     containerElement.innerHTML = ''; // Clear once at the start

//   projects.forEach(project => {
//     const article = document.createElement('article');
//     article.innerHTML = `
//       <${headingLevel}>${project.title}</${headingLevel}>
//       <img src="${project.image}" alt="${project.title}">
//       <p>${project.description}</p>
//     `;
//     containerElement.appendChild(article);
//   });
// }