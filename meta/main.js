import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let xScale
let yScale 

// Read and parse the CSV, converting numeric/date fields.
async function loadData() {
  const d = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: row.line ? +row.line : 0,
    depth: row.depth ? +row.depth : 0,
    length: row.length ? +row.length : 0,
    date: row.date ? new Date(row.date + 'T00:00' + (row.timezone || '')) : null,
    datetime: row.datetime ? new Date(row.datetime) : null,
  }));

  console.log('loaded loc.csv', d);
  return d;
}


function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let first = lines[0] || {};
    let { author, date, time, timezone, datetime } = first;

    let ret = {
      id: commit,
      url: 'https://github.com/leen324/portfolio/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime ? datetime.getHours() + datetime.getMinutes() / 60 : null,
      totalLines: lines.length,
    };

    Object.defineProperty(ret, 'lines', {
      value: lines,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    return ret;
  });
}



function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
  // number of files
  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // max length
  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  const maxFileLength = d3.max(fileLengths, d => d[1]);
  dl.append('dt').text('Maximum file length (lines)');
  dl.append('dd').text(maxFileLength);

  // time of day
  const workByPeriod = d3.rollups(
    data.filter(d => d.datetime),
    v => v.length,
    d => {
      const hour = d.datetime.getHours();
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
    }
  );

  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  dl.append('dt').text('Am most active in the:');
  dl.append('dd').text(maxPeriod || 'Equal footing');

}




function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 25]);

  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    })

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);

  // Add Y axis
  svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  createBrushSelector(svg);
  

}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

let data = await loadData();
let commits = processCommits(data);
console.log(commits);

renderCommitInfo(data, commits);

renderScatterPlot(data, commits);

function createBrushSelector(svg) {
    // Update brush initialization to listen for events
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();

}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  // TODO: return true if commit is within brushSelection
  // and false if not
  const [x0, x1] = selection.map((d) => d[0]); 
  const [y0, y1] = selection.map((d) => d[1]); 

  const x = xScale(commit.datetime); 
  const y = yScale(commit.hourFrac); 
  
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// // Read and parse the CSV, converting numeric/date fields.
// async function loadData() {
//   const d = await d3.csv('loc.csv', (row) => ({
//     ...row,
//     line: row.line ? +row.line : 0,
//     depth: row.depth ? +row.depth : 0,
//     length: row.length ? +row.length : 0,
//     date: row.date ? new Date(row.date + 'T00:00' + (row.timezone || '')) : null,
//     datetime: row.datetime ? new Date(row.datetime) : null,
//   }));

//   console.log('loaded loc.csv', d);
//   return d;
// }


// function processCommits(data) {
//   return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
//     let first = lines[0] || {};
//     let { author, date, time, timezone, datetime } = first;

//     let ret = {
//       id: commit,
//       url: 'https://github.com/leen324/portfolio/commit/' + commit,
//       author,
//       date,
//       time,
//       timezone,
//       datetime,
//       hourFrac: datetime ? datetime.getHours() + datetime.getMinutes() / 60 : null,
//       totalLines: lines.length,
//     };

//     Object.defineProperty(ret, 'lines', {
//       value: lines,
//       enumerable: false,
//       writable: false,
//       configurable: false,
//     });

//     return ret;
//   });
// }



// function renderCommitInfo(data, commits) {
//   // Create the dl element
//   const dl = d3.select('#stats').append('dl').attr('class', 'stats');

//   // Add total LOC
//   dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
//   dl.append('dd').text(data.length);

//   // Add total commits
//   dl.append('dt').text('Total commits');
//   dl.append('dd').text(commits.length);

//   // Add more stats as needed...
//   // number of files
//   const numFiles = d3.group(data, d => d.file).size;
//   dl.append('dt').text('Number of files');
//   dl.append('dd').text(numFiles);

//   // max length
//   const fileLengths = d3.rollups(
//     data,
//     v => d3.max(v, d => d.line),
//     d => d.file
//   );
//   const maxFileLength = d3.max(fileLengths, d => d[1]);
//   dl.append('dt').text('Maximum file length (lines)');
//   dl.append('dd').text(maxFileLength);

//   // time of day
//   const workByPeriod = d3.rollups(
//     data.filter(d => d.datetime),
//     v => v.length,
//     d => {
//       const hour = d.datetime.getHours();
//       if (hour >= 5 && hour < 12) return 'morning';
//       if (hour >= 12 && hour < 17) return 'afternoon';
//       if (hour >= 17 && hour < 21) return 'evening';
//       return 'night';
//     }
//   );

//   const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
//   dl.append('dt').text('Im most active in the:');
//   dl.append('dd').text(maxPeriod || 'Equal footing');

// }




// function renderScatterPlot(data, commits) {
//   // Put all the JS code of Steps inside this function
//   const width = 1000;
//   const height = 600;

//   const svg = d3
//     .select('#chart')
//     .append('svg')
//     .attr('viewBox', `0 0 ${width} ${height}`)
//     .style('overflow', 'visible');
  
//   const xScale = d3
//     .scaleTime()
//     .domain(d3.extent(commits, (d) => d.datetime))
//     .range([0, width])
//     .nice();

//   const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

//   const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

//   const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 25]);

//   const dots = svg.append('g').attr('class', 'dots');

//   const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

//   dots
//     .selectAll('circle')
//     .data(sortedCommits)
//     .join('circle')
//     .attr('cx', (d) => xScale(d.datetime))
//     .attr('cy', (d) => yScale(d.hourFrac))
//     .attr('r', (d) => rScale(d.totalLines))
//     .style('fill-opacity', 0.7)
//     .attr('fill', 'steelblue')
//     .on('mouseenter', (event, commit) => {
//         d3.select(event.currentTarget).style('fill-opacity', 1);
//         renderTooltipContent(commit);
//         updateTooltipVisibility(true);
//         updateTooltipPosition(event);
//     })
//     .on('mouseleave', () => {
//         d3.select(event.currentTarget).style('fill-opacity', 0.7);
//         updateTooltipVisibility(false);
//     })

//   const margin = { top: 10, right: 10, bottom: 30, left: 20 };

//   const usableArea = {
//     top: margin.top,
//     right: width - margin.right,
//     bottom: height - margin.bottom,
//     left: margin.left,
//     width: width - margin.left - margin.right,
//     height: height - margin.top - margin.bottom,
//   };

//   // Update scales with new ranges
//   xScale.range([usableArea.left, usableArea.right]);
//   yScale.range([usableArea.bottom, usableArea.top]);

//   // Create the axes
//   const xAxis = d3.axisBottom(xScale);
//   const yAxis = d3
//     .axisLeft(yScale)
//     .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

//   // Add X axis
//   svg
//   .append('g')
//   .attr('transform', `translate(0, ${usableArea.bottom})`)
//   .call(xAxis);

//   // Add Y axis
//   svg
//   .append('g')
//   .attr('transform', `translate(${usableArea.left}, 0)`)
//   .call(yAxis);

//   createBrushSelector(svg);

//   // Add gridlines BEFORE the axes
//   const gridlines = svg
//     .append('g')
//     .attr('class', 'gridlines')
//     .attr('transform', `translate(${usableArea.left}, 0)`);

//   // Create gridlines as an axis with no labels and full-width ticks
//   gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
  

// }

// function renderTooltipContent(commit) {
//   const link = document.getElementById('commit-link');
//   const date = document.getElementById('commit-date');

//   if (Object.keys(commit).length === 0) return;

//   link.href = commit.url;
//   link.textContent = commit.id;
//   date.textContent = commit.datetime?.toLocaleString('en', {
//     dateStyle: 'full',
//   });
// }

// function updateTooltipVisibility(isVisible) {
//   const tooltip = document.getElementById('commit-tooltip');
//   tooltip.hidden = !isVisible;
// }

// function updateTooltipPosition(event) {
//   const tooltip = document.getElementById('commit-tooltip');
//   tooltip.style.left = `${event.clientX}px`;
//   tooltip.style.top = `${event.clientY}px`;
// }

// let data = await loadData();
// let commits = processCommits(data);
// console.log(commits);

// // renderCommitInfo(data, commits);

// renderScatterPlot(data, commits);

// function createBrushSelector(svg) {
//   svg.call(d3.brush().on('start brush end', brushed));
//   svg.selectAll('.dots, .overlay ~ *').raise();
// }

// function brushed(event) {
//   const selection = event.selection;
//   d3.selectAll('circle').classed('selected', (d) =>
//     isCommitSelected(selection, d),
//   );
// }

// function isCommitSelected(selection, commit) {
//   if (!selection) {
//     return false; 
//   }
  
//   // TODO: return true if commit is within brushSelection
//   // and false if not
// //   const [[x0, y0], [x1, y1]] = selection;
// //   const x = xScale(commit.datetime);const y = yScale(commit.hourFrac);

// //   return x0 <= x && x <= x1 && y0 <= y && y <= y1;
// }

// function renderSelectionCount(selection) {
//   const selectedCommits = selection
//     ? commits.filter((d) => isCommitSelected(selection, d))
//     : [];

//   const countElement = document.querySelector('#selection-count');
//   countElement.textContent = `${
//     selectedCommits.length || 'No'
//   } commits selected`;

//   return selectedCommits;
// }



// animation

let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

let slider = document.getElementById("commit-progress");
let timeDisplay = document.getElementById("commit-time");
// Will get updated as user changes slider
let filteredCommits = commits;

function onTimeSliderChange() {
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  timeDisplay.textContent = commitMaxTime.toLocaleString("en", {
    dateStyle: "long",
    timeStyle: "short"});

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  d3.selectAll("circle")
    .attr("display", (d) =>
      d.datetime <= commitMaxTime ? null : "none"
    );

  updateScatterPlot(data, filteredCommits);
  }

slider.addEventListener("input", onTimeSliderChange);

onTimeSliderChange();

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll("*").remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, d => d.id)  // 🔧 Add key for stability
    .join(
      enter => enter.append("circle")
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', 'steelblue')
        .on('mouseenter', (event, d) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(d);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        }),
      update => update
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines)),
      exit => exit.remove()
    );
}