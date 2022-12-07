import { Grid, Flex, Heading, Box, Text, GridItem } from "@chakra-ui/react";
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set } from "firebase/database"
import { useLoaderData } from "react-router-dom"
import { StarIcon } from '@chakra-ui/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend
)
const getExtendBand = dbBand => {
  let band = {...dbBand}
  for (let date in band.events) {
    let event = band.events[date]
    event.start = new Date(`${date}T${event.start}`)
    event.end = new Date(`${date}T${event.end}`)
    event.timer = (event.end - event.start) / 1000 / 60
    for (let key in event.musicians) {
      let eMus = event.musicians[key]
      let bMus = band.musicians[key]
      eMus.start = new Date(`${date}T${eMus.start}`)
      eMus.end = new Date(`${date}T${eMus.end}`)
      eMus.timer = (eMus.end - eMus.start) / 1000 / 60
      eMus.efficiency = eMus.timer / event.timer
      bMus.efficiencySum = (bMus.efficiencySum || 0) + eMus.efficiency
      bMus.eventCount = (bMus.eventCount || 0) + 1
      event.efficiencySum = (event.efficiencySum || 0) + eMus.efficiency
    }
    let bMusCount = Object.keys(band.musicians).length
    event.efficiencyLost = bMusCount - event.efficiencySum
    event.efficiency = event.efficiencySum / bMusCount
  }
  let colors = [
    '#f19066', '#f5cd79', '#546de5', '#574b90', '#c44569',
    '#f78fb3', '#3dc1d3', '#e66767', '#303952', '#e15f41'
  ]
  for (let key in band.musicians) {
    let bMus = band.musicians[key]
    bMus.efficiencyAvg = bMus.efficiencySum / bMus.eventCount
    bMus.activityAvg = bMus.efficiencySum / Object.keys(band.events).length
    bMus.color = colors.shift() || '#e15f41'
  }
  band.months = {}
  for (
    let dt = new Date(Object.keys(band.events)[0].slice(0, 7) + '-01T00:00');
    dt <= new Date;
    dt.setMonth(dt.getMonth() + 1)
  ) {
    let dtISO = dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2)
    band.months[dtISO] = {
      name: dt.toLocaleString('default', {month: 'short', year: 'numeric'}),
      musicians: Object.keys(band.musicians).reduce((accum, key) => {
        accum[key] = {
          efficiencySum: 0
        }
        return accum
      }, {})
    }
    let month = band.months[dtISO]
    for (let date in band.events) {
      let event = band.events[date]
      if (dtISO == date.slice(0, 7)) {
        for(let key in event.musicians) {
          let musician = event.musicians[key]
          let monthMusician = month.musicians[key]
          monthMusician.efficiencySum += musician.efficiency
        }
      }
    }
    month.musiciansEfficiencySumAvg = 0
    for (let key in month.musicians) {
      let monthMusician = month.musicians[key]
      month.musiciansEfficiencySumAvg += monthMusician.efficiencySum
    }
    month.musiciansEfficiencySumAvg /= Object.keys(month.musicians).length
  }
  return band
}
const getBandActivity = band => {
  let labels = []
  let avg = []
  let musicians = Object.keys(band.musicians).reduce((accum, key) => {
    let bMus = band.musicians[key]
    accum[key] = {
      label: bMus.name,
      data: [],
      borderColor: bMus.color,
      backgroundColor: bMus.color
    }
    return accum
  }, {})
  for (let monthISO in band.months) {
    let month = band.months[monthISO]
    labels.push(month.name)
    avg.push(month.musiciansEfficiencySumAvg)
    for (let key in month.musicians) {
      let mMus = month.musicians[key]
      musicians[key].data.push(mMus.efficiencySum)
    }
  }
  return {
    labels,
    datasets: [
      {
        label: 'Средняя активность',
        type: 'line',
        data: avg
      },
      ...Object.keys(musicians).map(key => musicians[key])
    ]
  }
}

export async function loader({ params }) {
  const db = getDatabase()
  const error404 = new Response('', {status: 404, statusText: 'Not Found'})
  const error403 = new Response('', {status: 403, statusText: 'Forbidden'})
  const uid = params.band
  const band = await get(ref(db, `bands/${uid}`))
    .then(snapshot => snapshot?.val())
  if (!band) throw error404
  const user = await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
  if (!user) throw error404
  const accessBand = await get(ref(db, `access/${uid}`))
    .then(snapshot => snapshot?.val())
  const right = accessBand?.users?.[user.uid]
  const access = right === 'user' || right == 'admin'
  if (!access) throw error403
  return getExtendBand(band)
}

const Activity = ({band}) => {
  const bandActivity = getBandActivity(band)
  return (
    <Grid>
      <Heading as='h2' size='md' mb={2}>Активность группы</Heading>
      <Grid overflowX='scroll' css={{
        '&::-webkit-scrollbar': {
          height: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: '#eee',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#ccc',
          borderRadius: '24px',
        },
      }}>
        <Box w={bandActivity.labels.length * 100} mb={2}>
          <Bar data={bandActivity} options={{
            plugins: {
              legend: {
                display: false,
              }
            }
          }}/>
        </Box>
      </Grid>
      <Flex wrap='wrap' mt={4}>
        {Object.keys(band.musicians).map(key => 
          <Flex key={key} mr={4}>
            <StarIcon color={band.musicians[key].color} mr={1} />
            <Text fontSize={12}>{band.musicians[key].name}</Text>
          </Flex>
        )}
      </Flex>
    </Grid>
  )
}
const Musician = ({band, item}) => {
  const musician = band.musicians[item]
  const eventCount = Object.keys(band.events).length
  return (
    <>
    <Box mr={2}>
      <Heading as='h3' size='sm'>{musician.name}</Heading>
      <Box fontSize={12} bg='#eee' pl={4}>
        <Text>Репетиции: {musician.eventCount} из {eventCount}</Text>
        <Text>Активность: {parseInt(musician.activityAvg * 100)}%</Text>
      </Box>
    </Box>
    <Box>
      <Bar
        options={{
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: false
            }
          },
          indexAxis: 'y',
          scales: {
            x: {
              suggestedMax: 100
            },
            y: {
              display: false
            }
          }
        }}
        data={{
          labels: ['Активность'],
          datasets: [
            {
              label: musician.name,
              data: [parseInt(musician.activityAvg * 100)],
              backgroundColor: musician.color
            }
          ]
        }}
      />
    </Box>
    </>
  )
}
const Musicians = ({band}) => (
  <Grid>
    <Heading as='h2' size='md' mb={3}>Участники</Heading>
    <Grid templateColumns='max-content 160px'>
      {Object.keys(band.musicians).map(key =>
        <Musician key={key} band={band} item={key} />
      )}
    </Grid>
  </Grid>
)
const Event = ({band, item}) => {
  const event = band.events[item]
  const heading = (new Date(event.start)).toLocaleString("ru", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const eventEfficiency = parseInt(event.efficiency * 100)
  const eventEfficiencyLost = parseInt(event.efficiencyLost * 100)
  const [pie, musicians] = (() => {
    let pie = {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    }
    let musicians = []
    Object.keys(band.musicians).map(key => {
      let bMus = band.musicians[key]
      let eMus = event.musicians?.[key]
      let eMusEfficiency = parseInt(eMus?.efficiency * 100) || 0
      if (eMus) musicians.push({
        key: key,
        name: bMus.name,
        color: bMus.color,
        efficiency: eMusEfficiency
      })
      pie.labels.push(bMus.name)
      pie.datasets[0].data.push(eMusEfficiency)
      pie.datasets[0].backgroundColor.push(bMus.color)
    })
    pie.labels.push('Неиспользованно')
    pie.datasets[0].data.push(eventEfficiencyLost)
    pie.datasets[0].backgroundColor.push('#eee')
    return [pie, musicians]
  })()
  return (
    <>
    <Heading
      as='h3'
      size='sm'
      gridColumn='1/3'
      mb={2}
      css={{
        "&:first-letter": {
          textTransform: "uppercase"}
        }
      }
    >{heading}</Heading>
    <Box mb={4} mr={2}>
      <Pie data={pie} options={{
        plugins: {
          legend: {
            display: false
          }
        }
      }}/>
      <Text textAlign='center' pl={2} pt={2}>
        {eventEfficiency}%
      </Text>
    </Box>
    <Box mb={4}>
      {musicians.map(musician => 
        <Flex key={musician.key}>
          <StarIcon color={musician.color} mr={1}/>
          <Text fontSize={12}>
            {musician.name} {musician.efficiency}%
          </Text>
        </Flex>
      )}
      <Text fontSize={12} bg='#eee' p={2} mt={2} maxW={360}>
        {event.comment}
      </Text>
    </Box>
    </>
  )
}
const Events = ({band}) => (
  <Grid>
    <Heading as='h2' size='md' mb={3}>Репетиции</Heading>
    <Grid templateColumns='140px 1fr'>
      {Object.keys(band.events).reverse().map(key => 
        <Event key={key} band={band} item={key} />
      )}
    </Grid>
  </Grid>
)

export default function Band() {
  const band = useLoaderData()
  return (
    <>
    <Heading as='h1' textAlign='center' mb={3} textTransform='uppercase'>
      {band.name}
    </Heading>
    <Grid gap={6} alignContent='start'>
      <Activity band={band} />
      <Musicians band={band} />
      <Events band={band} />
    </Grid>
    </>
  )
}