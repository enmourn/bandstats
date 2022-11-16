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
  const dateFirstRehershal = (() => {
    if (band.rehershals) {
      let dateStr = Object.keys(band.rehershals)[0]
      let [year, month, day] = dateStr.split('-').map(str => parseInt(str))
      return new Date(year, month - 1, day)
    } else {
      return dateNow
    }
  })()
  const [currentCalendar, setCurrentCalendar] = useState({
    year: dateNow.getFullYear(),
    month: dateNow.getMonth()
  })
  const getCalendar = num => {
    let date = new Date(currentCalendar.year, currentCalendar.month + num)
    return {year: date.getFullYear(), month: date.getMonth()}
  }
  const getDates = () => {
    let year = currentCalendar.year
    let month = currentCalendar.month + 1
    return rehershals && rehershals[year] && rehershals[year][month] || {}
  }
  const calendarPrev = () => {
    return new Date(currentCalendar.year, currentCalendar.month) > dateFirstRehershal ?
      () => setCurrentCalendar(getCalendar(-1)) :
      false
  }
  const calendarNext = () => {
    return new Date(currentCalendar.year, currentCalendar.month + 1) < dateNow ?
      () => setCurrentCalendar(getCalendar(+1)) :
      false
  }
  const calendarClick = (day) => {
    console.log(day)
  }
  return (
    <Grid gap={6}>
      <Calendar
        year={currentCalendar.year}
        month={currentCalendar.month + 1}
        dates={getDates()}
        prev={calendarPrev()}
        next={calendarNext()}
        click={calendarClick}
      />
    </Grid>
  )
}