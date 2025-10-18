
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
  
	`<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark"></option>
			<option value="light"></option>
            <option value="dark"></option>

		</select>
	</label>`
);






