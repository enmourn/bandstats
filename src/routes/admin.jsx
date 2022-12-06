import { useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set } from "firebase/database";
import { useLoaderData } from "react-router-dom";
import CalendarEvents from '../components/CalendarEvents'
import FormEvent from '../components/FormEvent'
import { Grid, Heading } from '@chakra-ui/react'
import { useEffect } from 'react';

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
  if (!role?.bands[params.bandKey]?.rights === 'admin') throw res403
  return band
}

export async function action({ request }) {
  const formData = await request.formData()
  const date = formData.get('date')
  const data = formData.get('delete') ? null : {
    start: formData.get('start'),
    end: formData.get('end'),
    comment: formData.get('comment'),
    musicians: formData.getAll('musician').reduce((accum, current) => {
      accum[current] = {
        start: formData.get(`${current}-start`),
        end: formData.get(`${current}-end`)
      }
      return accum
    }, {})
  }
  set(ref(getDatabase(), `bands/digmenograve/events/${date}`), data)
  .then(() => {
  }).catch((error) => {
    console.log(error)
  });
}

export default function Admin() {
  const band = useLoaderData()
  const [event, setEvent] = useState()
  const calendarClick = date => {
    let dateISO = date.getFullYear() + '-'
    dateISO += ('0' + (date.getMonth() + 1)).slice(-2) + '-'
    dateISO += ('0' + date.getDate()).slice(-2)
    let event = band?.events?.[dateISO] || {}
    event.date = dateISO
    setEvent(event)
  }
  useEffect(() => {
    setEvent(null)
  }, [band])
  return (
    <>
      <Heading as='h1' textAlign='center' mb={3} textTransform='uppercase'>
        {band.name}
      </Heading>
      <Grid gap={6} m='auto'>
        <CalendarEvents events={band.events} click={calendarClick} />
        {event && <FormEvent event={event} musicians={band.musicians}/>}
      </Grid>
    </>
  )
}