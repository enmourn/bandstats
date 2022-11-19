import { useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, child, get, set} from "firebase/database";
import { useLoaderData, Form } from "react-router-dom";
import CalendarEvents from '../components/CalendarEvents'
import FormEvent from '../components/FormEvent'
import { Grid } from '@chakra-ui/react'
import { useEffect } from 'react';

export async function loader({ params }) {
  const band = await get(child(ref(getDatabase()), `bands/${params.bandKey}`))
    .then(snapshot => snapshot.val())
  if (!band) throw new Response("", {
    status: 404,
    statusText: "Not Found"
  })
  const user = await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
  if (!user || user.uid != band.admin) throw new Response("", {
    status: 403,
    statusText: "Forbidden"
  })
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
    let year = date.getFullYear()
    let month = date.getMonth()
    let day = date.getDate()
    let event = band?.events?.[year]?.[month + 1]?.[day] || {}
    event.date = date
    setEvent(event)
  }
  useEffect(() => {
    setEvent(null)
  }, [band])
  return (
    <Grid gap={10}>
      <CalendarEvents events={band.events} click={calendarClick} />
      {event && <FormEvent event={event} musicians={band.musicians}/>}
    </Grid>
  )
}