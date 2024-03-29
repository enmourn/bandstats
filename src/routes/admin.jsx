import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, set, update, onValue, off } from "firebase/database"
import { useLoaderData, useSubmit, Form } from "react-router-dom"
import { useConfirm } from "../components/useConfirm"
import { getEventMusicians } from "../libs/functions"
import CalendarEvents from "../components/CalendarEvents"
import FormEvent from "../components/FormEvent"
import { Grid, Heading, Text, Button, VisuallyHiddenInput } from "@chakra-ui/react"

const AccessRequests = ({ bandUid }) => {
  const [requests, setRequests] = useState([])
  const { isConfirmed } = useConfirm()
  const submit = useSubmit()
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (await isConfirmed("Вы уверены, что хотите предоставить доступ?")) {
      let formData = new FormData(e.target)
      submit(formData, { method: "post" })
    }
  }
  useEffect(() => {
    const db = getDatabase()
    const accessBandRef = ref(db, `access/${bandUid}`)
    onValue(accessBandRef, async (snapshot) => {
      const accessBand = snapshot.val()
      let requests = []
      for (let userUid in accessBand) {
        if (accessBand[userUid] == "request") {
          let user = await get(ref(db, `users/${userUid}`)).then((snapshot) => snapshot.val())
          user.uid = userUid
          user.bandUid = bandUid
          requests.push(user)
        }
      }
      setRequests(requests)
    })
    return () => {
      off(accessBandRef)
    }
  }, [])
  return (
    <>
      {requests.map((user) => (
        <Grid
          key={user.uid}
          templateColumns="1fr max-content"
          columnGap={4}
          bg="gray.100"
          px={4}
          py={2}
          borderRadius={5}
          alignItems="center"
        >
          <Grid>
            <Text fontWeight="bold" textTransform="uppercase">
              Запрос на доступ
            </Text>
            <Text>Пользователь: {user.name}</Text>
            <Text>Email: {user.email}</Text>
          </Grid>
          <Form method="post" onSubmit={handleSubmit}>
            <VisuallyHiddenInput name="action" defaultValue="allowAccess" />
            <VisuallyHiddenInput name="band" defaultValue={user.bandUid} />
            <VisuallyHiddenInput name="user" defaultValue={user.uid} />
            <Button type="submit" colorScheme="red">
              OK
            </Button>
          </Form>
        </Grid>
      ))}
    </>
  )
}

export async function loader({ params }) {
  const db = getDatabase()
  const error404 = new Response("", { status: 404, statusText: "Not Found" })
  const error403 = new Response("", { status: 403, statusText: "Forbidden" })
  const bandUid = params.band
  const band = await get(ref(db, `bands/${bandUid}`)).then((snapshot) => snapshot?.val())
  if (!band) throw error404
  const accessBand = await get(ref(db, `access/${bandUid}`)).then((snapshot) => snapshot?.val())
  const user = await new Promise((resolve) => onAuthStateChanged(getAuth(), (user) => resolve(user)))
  const right = (user && accessBand[user.uid]) || accessBand["all"]
  const access = {
    view: right === "user" || right === "admin",
    edit: right === "admin",
    request: right === "request",
  }
  if (!access.edit) throw error403
  return { bandUid, band }
}
export async function action({ request }) {
  const db = getDatabase()
  const formData = await request.formData()
  if (formData.get("action") == "allowAccess") {
    let band = formData.get("band")
    let user = formData.get("user")
    update(ref(db, `access/${band}`), { [user]: "user" })
    return
  }
  if (formData.get("action") == "updateEvent") {
    let date = formData.get("date")
    let bandUid = formData.get("bandUid")
    let data = {
      start: formData.get("start"),
      end: formData.get("end"),
      comment: formData.get("comment"),
      musicians: formData.getAll("musician").reduce((accum, current) => {
        accum[current] = {
          start: formData.get(`${current}-start`),
          end: formData.get(`${current}-end`),
        }
        return accum
      }, {}),
    }
    update(ref(db, `bands/${bandUid}/events/${date}`), data)
    return
  }
  if (formData.get("action") == "deleteEvent") {
    let date = formData.get("date")
    let bandUid = formData.get("bandUid")
    set(ref(db, `bands/${bandUid}/events/${date}`), null)
    return
  }
}
export default function Admin() {
  const { bandUid, band } = useLoaderData()
  const [event, setEvent] = useState()
  const calendarClick = (date) => {
    let dateISO = date.getFullYear() + "-"
    dateISO += ("0" + (date.getMonth() + 1)).slice(-2) + "-"
    dateISO += ("0" + date.getDate()).slice(-2)
    let event = band?.events?.[dateISO] || {}
    event.date = dateISO
    setEvent(event)
  }
  return (
    <>
      <Heading as="h1" textAlign="center" mb={3} textTransform="uppercase">
        {band.name}
      </Heading>
      <Grid gap={6} m="auto">
        <AccessRequests bandUid={bandUid} />
        <CalendarEvents events={band.events} click={calendarClick} />
        {event && (
          <FormEvent
            event={event}
            musicians={getEventMusicians(band.musicians, new Date(event.date))}
            bandUid={bandUid}
          />
        )}
      </Grid>
    </>
  )
}
