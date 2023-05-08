const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

// START copied from Experiment #6

let constants = {
  places: [],
  prompt: 'replace with what the user types in',
  // time: dayjs().format(),
  // today: dayjs().format('dddd, MMM D, YYYY'),
}
let data = {}
let schemas = [
  {
    cities: [
      {
        name: 'city name',
        // description: 'what this city is known for',
      },
    ],
  },
  {
    city: 'same city name as before',
    areas: [
      {
        name: 'local area name',
        description: 'what this area is known for',
      },
    ],
  },
  {
    city: 'same city name as before',
    areas: [
      {
        name: 'local area name',
        address: '1234 Main St.',
        latitude: 45.67,
        longitude: -123.45,
      },
    ],
  },
]

let history = [
  {
    role: 'system',
    content: `I want you to help me build a site that lists things to do in popular areas of large cities.`,
  },
]

const turbo = async messages => {
  console.log('New request:', messages)
  g('status-text').textContent = messages.at(-1).content.split('.')[0]
  const response = await fetch(`https://us-central1-samantha-374622.cloudfunctions.net/turbo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })
  return response.text()
}

const toJSON = str => {
  const curly = str.indexOf('{')
  const square = str.indexOf('[')
  let first
  if (curly < 0) first = '[' // only for empty arrays
  else if (square < 0) first = '{'
  else first = curly < square ? '{' : '['
  const last = first === '{' ? '}' : ']'
  // ensure JSON is complete
  let count = 0
  for (c of str) {
    if (c === '{' || c === '[') count++
    else if (c === '}' || c === ']') count--
  }
  if (!count) return JSON.parse(str.slice(str.indexOf(first), str.lastIndexOf(last) + 1))
}

// END copied from Experiment #6

// generic utilities
const textareas = q('textarea')
let currentPrompt = 0

const makeMagic = () => {
  g('status-loader').classList.add('dot-pulse')
  history.push({
    role: 'user',
    content: `${textareas[currentPrompt].value}. Return a JSON object copying this schema: ${JSON.stringify(
      schemas[currentPrompt],
    )} and use the values as hints.`,
  })
  try {
    turbo(history).then(response => {
      history.push({
        role: 'assistant',
        content: response,
      })
      console.log('New response:', history)
      const json = toJSON(response)

      // areas
      if (json.hasOwnProperty('areas')) {
        data.cities = data.cities.map(city => {
          if (city.name === json.city) {
            city.areas = json.areas
          }
          return city
        })
      } else data = json // cities
      g('object').textContent = JSON.stringify(data, null, 2)
      Prism.highlightAll()
      renderPreview()

      if (currentPrompt !== textareas.length - 1) {
        currentPrompt += 1
        makeMagic()
      } else {
        g('status-loader').classList.remove('dot-pulse')
      }
    })
  } catch (error) {
    renderError(error)
  }
}

g('run').addEventListener('click', makeMagic)

const renderError = error => {
  g('status-loader').classList.remove('dot-pulse')
  g('status').classList.add('error')
  g('status-text').textContent = error
}

const renderPreview = () => {
  g('render').innerHTML = ''

  const h1 = document.createElement('h1')
  h1.textContent = 'Cities'
  g('render').appendChild(h1)

  const cities = document.createElement('div')
  cities.id = 'cities'
  g('render').appendChild(cities)

  data.cities.forEach(c => {
    const city = document.createElement('a')
    city.href = '#'
    city.textContent = c.name
    cities.appendChild(city)

    if (c.areas) {
      c.areas.forEach((a, i) => {
        const area = document.createElement('a')
        area.className = !i ? 'first area' : 'area'
        area.href = '#'
        area.textContent = a.name
        cities.appendChild(area)
      })

      const first = c.areas[0]

      const areah1 = document.createElement('h1')
      areah1.textContent = `Things to do in ${first.name}`
      g('render').appendChild(areah1)

      const areaDesc = document.createElement('p')
      areaDesc.textContent = first.description
      g('render').appendChild(areaDesc)

      if (first.hasOwnProperty('address')) {
        const h2 = document.createElement('h2')
        h2.textContent = `Places to go`
        g('render').appendChild(h2)

        const map = document.createElement('div')
        map.id = 'map'
        g('render').appendChild(map)
        renderMap([first.longitude, first.latitude])
      }
    }
  })
}

const renderMap = coordsArray => {
  mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGJvcm4iLCJhIjoiY2w1Ym0wbHZwMDh3eTNlbnh1aW51cm0ydyJ9.Z5h4Vkk8zqjf6JydrOGXGA'
  const map = new mapboxgl.Map({
    center: coordsArray,
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    zoom: 14,
  })
  map.addControl(new mapboxgl.NavigationControl())
  const marker = new mapboxgl.Marker().setLngLat(coordsArray).addTo(map)
}

// categories
// ideas
// venues
// places
