import { useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, child, get, set} from "firebase/database";
import { useLoaderData, Form } from "react-router-dom";
import CalendarEvents from '../components/CalendarEvents'
import { FormControl, FormLabel, Input, Grid, Text, Textarea, GridItem} from '@chakra-ui/react'

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

const FormEvent = ({event}) => {
  const title = event.date.toLocaleString("ru", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  return (
    <Form key={event.date}>
      <Text
        css={{
          "&:first-letter": {
            textTransform: "uppercase",
          },
        }}
        textAlign='center'
        fontSize={22}
        mb={2}
      >{title}</Text>
      <Grid templateColumns='repeat(2, 1fr)' gap={2}>
        <FormControl>
          <FormLabel>Начало:</FormLabel>
          <Input type='time' defaultValue={event.start}/>
        </FormControl>
        <FormControl>
          <FormLabel>Окончание:</FormLabel>
          <Input type='time' defaultValue={event.end}/>
        </FormControl>
        <GridItem colSpan={2}>
          <FormControl>
            <FormLabel>Комментарий:</FormLabel>
            <Textarea defaultValue={event.comment}/>
          </FormControl>
        </GridItem>
      </Grid>  
    </Form>
  )
}

export default function Admin() {
  const band = useLoaderData()
  const defaultEvent = {
    start: '23:00',
    end: '22:00'
  }
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
      {event && <FormEvent event={event} />}
    </Grid>
  )
}