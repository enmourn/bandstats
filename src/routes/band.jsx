import { Grid, Heading } from "@chakra-ui/react";
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set } from "firebase/database"
import { useState } from "react"
import { useEffect, useRef } from "react"
import { useLoaderData } from "react-router-dom"
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'

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
    let bandStatItem = {
      name: start.toLocaleString('default', { month: 'long' }),
      activity: 0
    }
    let musiciansStatItem = {
      name: start.toLocaleString('default', { month: 'long' }),
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
  const container = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    setWidth(container.current.clientWidth)
  }, [])
  return (
    <Grid alignContent='start' ref={container}>
      <Heading as='h1' size='xl' mb={2}>{band.name}</Heading>
      <Heading as='h2' size='md' mb={2}>Активность группы</Heading>
      <LineChart width={width} height={width * 0.6} data={bandStat} margin={{left: -16}}>
        <XAxis dataKey="name" />
        <YAxis/>
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="activity" stroke="teal" fillOpacity={1} fill="url(#colorUv)" />
      </LineChart>
      <Heading as='h2' size='md' mb={2} mt={2}>Активность участников</Heading>
      <LineChart width={width} height={width * 0.8} data={musiciansStat} margin={{left: -16}}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Legend />
        <Line type="monotone" dataKey="aleksandrkazarin" stroke="teal" />
        <Line type="monotone" dataKey="ivanmishin" stroke="teal" />
        <Line type="monotone" dataKey="nikitasmirnov" stroke="teal" />
        <Line type="monotone" dataKey="vitalijpotapov" stroke="teal" />
        <Line type="monotone" dataKey="аleksejrumyancev" stroke="teal" />
      </LineChart>
    </Grid>
  )
}