
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));

}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  // add the rest of your pages here
  { url: "contact/index.html", title: "Contact Me" },
  { url: "resume/index.html", title: "Resume" },
  { url: "https://github.com/leen324", title: "My GitHub", external: true }
];

let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // next step: create link and add it to nav`

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = p.title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname,
    );

    nav.append(a);

    a.toggleAttribute("target", a.host !== location.host);

}


document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<!-- TODO add <option> elements here -->
            <option value="light dark">Automatic</option>
			<option value="light">Light</option>
            <option value="dark">Dark</option>

		</select>
	</label>`,
);

let select = document.querySelector('.color-scheme select');

if ("colorScheme" in localStorage) {
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
  select.value = localStorage.colorScheme; 
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  
  document.documentElement.style.setProperty('color-scheme', event.target.value);

  localStorage.colorScheme = event.target.value

});


// starting the json sect lab 4

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = ''; 

  const projectArray = Array.isArray(projects) ? projects : [projects];

  projectArray.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div class="project-details">
        <p class="description">${project.description}</p>
        <p class="year"><strong>circa:</strong> ${project.year ?? 'N/A'}</p>
      </div>
    `;
    containerElement.appendChild(article);
  });
}

// starting steep 3.2
export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);

}
