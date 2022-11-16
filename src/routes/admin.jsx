import { useState } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, child, get } from "firebase/database";
import { useLoaderData } from "react-router-dom";
import Calendar from '../components/calendar'
import { Grid } from '@chakra-ui/react'

const rehershalsToTree = rehershals => {
  let result = {}
  Object.keys(rehershals).forEach(key => {
    let [year, month, day] = key.split('-').map(str => parseInt(str))
    result[year] ? null : result[year] = {}
    result[year][month] ? null : result[year][month] = {}
    result[year][month][day] ? null : result[year][month][day] = {[day]: rehershals[key]}
  })
  return result
}

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

export default function Admin() {
  const band = useLoaderData()
  const rehershals = band.rehershals ? rehershalsToTree(band.rehershals) : null
  const dateNow = new Date
  const [dateCurrent, setDateCurrent] = useState(dateNow)
  const calendarGetDates = () => {
    let year = dateCurrent.getFullYear()
    let month = dateCurrent.getMonth() + 1
    return rehershals && rehershals[year] && rehershals[year][month] || {}
  }
  const calendarPrev = () => {
    let datePrev = new Date(dateCurrent.getFullYear(), dateCurrent.getMonth() - 1)
    return () => setDateCurrent(datePrev)
  }
  const calendarNext = () => {
    let dateNext = new Date(dateCurrent.getFullYear(), dateCurrent.getMonth() + 1)
    return dateNext <= dateNow ? () => setDateCurrent(dateNext) : false
  }
  const calendarClick = (day) => {
    console.log(day)
  }
  return (
    <Grid gap={6}>
      <Calendar
        year={dateCurrent.getFullYear()}
        month={dateCurrent.getMonth() + 1}
        dates={calendarGetDates()}
        prev={calendarPrev()}
        next={calendarNext()}
        click={calendarClick}
      />
    </Grid>
  )
}