import { useState } from 'react'
import Calendar from '../components/Calendar'

export default function CalendarEvents({events, click}) {
  const dateNow = new Date
  const [dateCurrent, setDateCurrent] = useState(dateNow)
  const calendarGetDates = () => {
    let year = dateCurrent.getFullYear()
    let month = dateCurrent.getMonth() + 1
    return events?.[year]?.[month] || {}
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