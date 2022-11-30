import { Grid, Heading } from "@chakra-ui/react";
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set } from "firebase/database"
import { useLoaderData } from "react-router-dom"
import { LineChart, Line, CartesianGrid, XAxis, Legend} from 'recharts'

export async function loader({ params }) {
  const db = getDatabase()
  const res404 = new Response('', {status: 404, statusText: 'Not Found'})
  const res403 = new Response('', {status: 403, statusText: 'Forbidden'})
  const band = await get(ref(db, `bands/${params.bandKey}`))
    .then(snapshot => snapshot?.val())
  if (!band) throw res404
  const user = await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
  if (!user) throw res404
  const role = user && await get(ref(db, `roles/${user.uid}`))
    .then(snapshot => snapshot?.val())
  if (!role?.bands[params.bandKey]?.rights === 'user') throw res403
  for (let date in band.events) {
    let event = band.events[date]
    event.start = new Date(`${date}T${event.start}`)
    event.end = new Date(`${date}T${event.end}`)
    event.timer = (event.end - event.start) / 1000 / 60
    for (let uid in event.musicians) {
      let musician = event.musicians[uid]
      musician.start = new Date(`${date}T${musician.start}`)
      musician.end = new Date(`${date}T${musician.end}`)
      musician.timer = (musician.end - musician.start) / 1000 / 60
      musician.efficiency = musician.timer / event.timer
      event.efficiency = (event.efficiency || 0) + musician.efficiency
    }
    event.efficiency = event.efficiency / Object.keys(event.musicians).length
  }
  // stat
  let start = new Date(Object.keys(band.events)[0].slice(0, 7) + '-01T00:00')
  let end = new Date
  let bandStat = []
  let musiciansStat = []
  for (start; start <= end; start.setMonth(start.getMonth() + 1)) {
    // month
    let monthName = start.toLocaleString('default', {
      month: 'short',
      year: '2-digit'
    }).slice(0, -3).replace(' ', '')
    let bandStatItem = {
      name: monthName,
      activity: 0
    }
    let musiciansStatItem = {
      name: monthName,
      ...Object.keys(band.musicians).reduce((accum, current) => {
        accum[current] = 0
        return accum
      }, {})
    }
    for (let key in band.events) {
      // event
      let date = new Date(key.slice(0, 7) + '-01T00:00')
      let event = band.events[key]
      if (date.getTime() == start.getTime()) {
        bandStatItem.activity += event.efficiency
        for (let key in event.musicians) {
          let musician = event.musicians[key]
          musiciansStatItem[key] += musician.efficiency
        }
      }
    }
    musiciansStat.push(musiciansStatItem)
    bandStat.push(bandStatItem)
  }
  return {band, bandStat, musiciansStat}
}

export default function Band() {
  const {band, bandStat, musiciansStat} = useLoaderData()
  const colors = [
    '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#f1c40f', '#e67e22', '#e74c3c'
  ]
  return (
    <Grid alignContent='start'>
      <Heading as='h1' size='xl' mb={2}>{band.name}</Heading>
      <Heading as='h2' size='md' mb={2}>Активность группы</Heading>
      <Grid overflowX='auto'>
        <LineChart
          data={bandStat}
          width={bandStat.length * 80}
          height={200}
          margin={{left: 30, right: 30, bottom: 10}}
        >
          <XAxis dataKey="name" />
          <CartesianGrid strokeDasharray="3 3" />
          <Line type="monotone" dataKey="activity" stroke="teal" fillOpacity={1} fill="url(#colorUv)" />
        </LineChart>
      </Grid>
      <Heading as='h2' size='md' mb={2} mt={2}>Активность участников</Heading>
      <Grid overflowX='auto'>
      <LineChart
          data={musiciansStat}
          width={musiciansStat.length * 80}
          height={300}
          margin={{left: 30, right: 30, bottom: 10}}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <Legend />
          {Object.keys(band.musicians).map((key, index) => 
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index] || 'teal'}
            />
          )}
        </LineChart>
      </Grid>
    </Grid>
  )
}