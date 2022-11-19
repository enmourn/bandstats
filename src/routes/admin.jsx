import { useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, child, get, set} from "firebase/database";
import { useLoaderData, Form } from "react-router-dom";
import CalendarEvents from '../components/CalendarEvents'
import FormEvent from '../components/FormEvent'
import { Grid } from '@chakra-ui/react'

export async function loader({ params }) {
  // const band = await get(child(ref(getDatabase()), `bands/${params.bandKey}`))
  //   .then(snapshot => snapshot.val())
  // if (!band) throw new Response("", {
  //   status: 404,
  //   statusText: "Not Found"
  // })
  // const user = await new Promise(resolve => 
  //   onAuthStateChanged(getAuth(), user => resolve(user)))
  // if (!user || user.uid != band.admin) throw new Response("", {
  //   status: 403,
  //   statusText: "Forbidden"
  // })
  // return band
  return {
    musicians: {
      "aleksandrkazarin": "Александр Казарин",
      "ivanmishin": "Иван Мишин",
      "nikitasmirnov": "Никита Смирнов",
      "vitalijpotapov": "Виталий Потапов",
      "аleksejrumyancev": "Алексей Румянцев"
    }
  }
}

export async function action({ request }) {
  const formData = await request.formData()
  console.log(formData.getAll('musician'))
}

export default function Admin() {
  const band = useLoaderData()
  const defaultEvent = {
    start: '20:00',
    end: '22:00',
  }
  defaultEvent.date = new Date(2022, 9, 6)
  const [event, setEvent] = useState()
  const calendarClick = date => {
    let year = date.getFullYear()
    let month = date.getMonth()
    let day = date.getDate()
    let event = band?.events?.[year]?.[month + 1]?.[day] || defaultEvent
    event.date = date
    setEvent(event)
  }
  return (
    <Grid gap={10}>
      <CalendarEvents events={band.events} click={calendarClick} />
      {event && <FormEvent event={event} musicians={band.musicians}/>}
    </Grid>
  )
}