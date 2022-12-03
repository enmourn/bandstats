import { Grid, Flex, Heading, Box, Text} from "@chakra-ui/react";
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set } from "firebase/database"
import { useLoaderData } from "react-router-dom"
import * as json from '../../db.json'
import { StarIcon } from '@chakra-ui/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
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
      event.efficiency = (event.efficiency || 0) + eMus.efficiency
    }
    event.efficiency = event.efficiency / Object.keys(event.musicians).length
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
  const res404 = new Response('', {status: 404, statusText: 'Not Found'})
  const res403 = new Response('', {status: 403, statusText: 'Forbidden'})
  const bandDB = await get(ref(db, `bands/${params.bandKey}`))
    .then(snapshot => snapshot?.val())
  if (!bandDB) throw res404
  const user = await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
  if (!user) throw res404
  const role = user && await get(ref(db, `roles/${user.uid}`))
    .then(snapshot => snapshot?.val())
  if (!role?.bands[params.bandKey]?.rights === 'user') throw res403
  let band = getExtendBand(bandDB)
  let bandActivity = getBandActivity(band)
  return {band, bandActivity}
}

export default function Band() {
  const {band, bandActivity} = useLoaderData()
  return (
    <Grid alignContent='start' gap={4}>
      <Heading as='h1' textTransform='uppercase'>{band.name}</Heading>
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
            <Flex key={key} mr={4} mb={1}>
              <StarIcon color={band.musicians[key].color} mr={1} />
              <Text fontSize={12}>{band.musicians[key].name}</Text>
            </Flex>
          )}
        </Flex>
      </Grid>
      <Grid>
        <Heading as='h2' size='md' mb={2}>Репетиции</Heading>
      </Grid>
    </Grid>
  )
}