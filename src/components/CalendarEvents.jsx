import { useState } from 'react'
import Calendar from '../components/Calendar'

export default function CalendarEvents({events, click}) {
  const dateNow = new Date
  const [dateCurrent, setDateCurrent] = useState(dateNow)
  const calendarGetDates = () => {
    let year = dateCurrent.getFullYear()
    let month = ('0' + (dateCurrent.getMonth() + 1)).slice(-2)
    let dates = {}
    for (let key in events) {
      if (key.slice(0, 7) === `${year}-${month}`) {
        dates[parseInt(key.slice(8, 10))] = events[key]
      }
    }
    return dates
  }
  const calendarPrev = () => {
    let datePrev = new Date(dateCurrent.getFullYear(), dateCurrent.getMonth() - 1)
    return () => setDateCurrent(datePrev)
  }
  const calendarNext = () => {
    let dateNext = new Date(dateCurrent.getFullYear(), dateCurrent.getMonth() + 1)
    return dateNext <= dateNow ? () => setDateCurrent(dateNext) : false
  }
  return (
    <Calendar
      year={dateCurrent.getFullYear()}
      month={dateCurrent.getMonth() + 1}
      dates={calendarGetDates()}
      prev={calendarPrev()}
      next={calendarNext()}
      click={click}
    />
  )
}