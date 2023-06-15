import { Grid, Flex, Heading, Box, Text } from "@chakra-ui/react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get } from "firebase/database"
import { useLoaderData } from "react-router-dom"
import { StarIcon } from "@chakra-ui/icons"
import { getEventMusicians } from "../libs/functions"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Pie } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend
)
const getMusicianEvents = (musician, events) => {
  let musicianEvents = {}
  for (let key in events) {
    let event = events[key]
    let date = new Date(key)
    if (date < new Date(musician.joined)) continue
    if (musician.left && date > new Date(musician.left)) continue
    musicianEvents[key] = event
  }
  return musicianEvents
}
const getExtendBand = (dbBand) => {
  const sortMusicians = () => {
    const musicians = Object.entries(band.musicians).sort((a, b) => {
      if (a[1].joined > b[1].joined) return 1
      if (a[1].joined < b[1].joined) return -1
      return 0
    })
    band.musicians = Object.fromEntries(musicians)
  }
  const extendEvents = () => {
    if (!band.events) return
    for (let date in band.events) {
      let eventMusicians = getEventMusicians(band.musicians, new Date(date))
      let event = band.events[date]
      event.start = new Date(`${date}T${event.start}`)
      event.end = new Date(`${date}T${event.end}`)
      event.timer = (event.end - event.start) / 1000 / 60
      event.musiciansCount = Object.keys(eventMusicians).length
      event.musiciansTimeAvg = 0
      event.efficiencySum = 0
      event.efficiencyLost = event.musiciansCount
      event.efficiency = 0
      if (!event.musicians) continue
      for (let key in event.musicians) {
        let eMus = event.musicians[key]
        eMus.start = new Date(`${date}T${eMus.start}`)
        eMus.end = new Date(`${date}T${eMus.end}`)
        eMus.timer = (eMus.end - eMus.start) / 1000 / 60
        eMus.efficiency = eMus.timer / event.timer
        event.musiciansTimeAvg += eMus.timer
        event.efficiencySum += eMus.efficiency
      }
      event.musiciansTimeAvg /= event.musiciansCount
      event.efficiencyLost = event.musiciansCount - event.efficiencySum
      event.efficiency = event.efficiencySum / event.musiciansCount
    }
  }
  const extendMusicians = () => {
    let colors = ["#fd7f6f", "#7eb0d5", "#b2e061", "#bd7ebe", "#ffb55a", "#ffee65", "#beb9db", "#fdcce5", "#8bd3c7"]
    for (let musicianKey in band.musicians) {
      let bMus = band.musicians[musicianKey]
      bMus.efficiencySum = 0
      bMus.presentEventsCount = 0
      bMus.efficiencyAvg = 0
      bMus.activityAvg = 0
      bMus.color = colors.shift() || "#e15f41"
      if (!band.events) continue
      let musicianEvents = getMusicianEvents(bMus, band.events)
      bMus.allEventsCount = Object.keys(musicianEvents).length
      for (let eventKey in musicianEvents) {
        let event = musicianEvents[eventKey]
        if (musicianKey in event.musicians) {
          let eMus = event.musicians[musicianKey]
          bMus.efficiencySum += eMus.efficiency
          bMus.presentEventsCount++
        }
      }
      bMus.efficiencyAvg = bMus.efficiencySum / bMus.presentEventsCount
      bMus.activityAvg = bMus.efficiencySum / bMus.allEventsCount
    }
  }
  const extendMonths = () => {
    band.months = {}
    let dt = band.events ? new Date(Object.keys(band.events)[0].slice(0, 7) + "-01T00:00") : new Date()
    for (dt; dt <= new Date(); dt.setMonth(dt.getMonth() + 1)) {
      let dtISO = dt.getFullYear() + "-"
      dtISO += ("0" + (dt.getMonth() + 1)).slice(-2)
      band.months[dtISO] = {
        name: dt.toLocaleString("default", { month: "short", year: "numeric" }),
        musicians: Object.keys(band.musicians).reduce((accum, key) => {
          accum[key] = {
            efficiencySum: 0,
          }
          return accum
        }, {}),
      }
      let month = band.months[dtISO]
      month.musiciansTimeAvg = 0
      if (!band.events) continue
      for (let date in band.events) {
        let event = band.events[date]
        if (dtISO == date.slice(0, 7)) {
          month.musiciansTimeAvg += event.musiciansTimeAvg
          for (let key in event.musicians) {
            let musician = event.musicians[key]
            let monthMusician = month.musicians[key]
            monthMusician.efficiencySum += musician.timer
          }
        }
      }
    }
  }
  let band = { ...dbBand }
  band.eventCount = band.events ? Object.keys(band.events).length : 0
  sortMusicians()
  extendEvents()
  extendMusicians()
  extendMonths()
  return band
}
const getBandActivity = (band) => {
  let labels = []
  let avg = []
  let musicians = Object.keys(band.musicians).reduce((accum, key) => {
    let bMus = band.musicians[key]
    accum[key] = {
      label: bMus.name,
      data: [],
      borderColor: bMus.color,
      backgroundColor: bMus.color,
    }
    return accum
  }, {})
  for (let monthISO in band.months) {
    let month = band.months[monthISO]
    labels.push(month.name)
    avg.push(month.musiciansTimeAvg)
    for (let key in month.musicians) {
      let mMus = month.musicians[key]
      musicians[key].data.push(mMus.efficiencySum)
    }
  }
  return {
    labels,
    datasets: [
      {
        label: "Средняя активность",
        type: "line",
        data: avg,
      },
      ...Object.keys(musicians).map((key) => musicians[key]),
    ],
  }
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
  if (!access.view) throw error403
  return getExtendBand(band)
}

const Activity = ({ band }) => {
  const bandActivity = getBandActivity(band)
  return (
    <Grid>
      <Heading as="h2" size="md" mb={2}>
        Активность группы
      </Heading>
      <Grid
        overflowX="scroll"
        css={{
          "&::-webkit-scrollbar": {
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#eee",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "24px",
          },
        }}
      >
        <Box w={600} h={300} mb={2}>
          <Bar
            data={bandActivity}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </Box>
      </Grid>
      <Flex wrap="wrap" mt={4}>
        {Object.keys(band.musicians).map((key) => (
          <Flex key={key} mr={4}>
            <StarIcon color={band.musicians[key].color} mr={1} />
            <Text fontSize={12}>{band.musicians[key].name}</Text>
          </Flex>
        ))}
      </Flex>
    </Grid>
  )
}
const Musician = ({ band, item }) => {
  const musician = band.musicians[item]
  return (
    <>
      <Box mr={2}>
        <Heading as="h3" size="sm">
          {musician.name}
        </Heading>
        <Box fontSize={12} bg="#eee" pl={4}>
          <Text>
            Репетиции: {musician.presentEventsCount} из {musician.allEventsCount}
          </Text>
          <Text>Активность: {parseInt(musician.activityAvg * 100)}%</Text>
        </Box>
      </Box>
      <Box>
        <Bar
          options={{
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: false,
              },
            },
            indexAxis: "y",
            scales: {
              x: {
                suggestedMax: 100,
              },
              y: {
                display: false,
              },
            },
          }}
          data={{
            labels: ["Активность"],
            datasets: [
              {
                label: musician.name,
                data: [parseInt(musician.activityAvg * 100)],
                backgroundColor: musician.color,
              },
            ],
          }}
        />
      </Box>
    </>
  )
}
const Musicians = ({ band }) => (
  <Grid>
    <Heading as="h2" size="md" mb={3}>
      Участники
    </Heading>
    <Grid templateColumns="max-content 160px">
      {Object.keys(band.musicians).map((key) => (
        <Musician key={key} band={band} item={key} />
      ))}
    </Grid>
  </Grid>
)
const Event = ({ band, item }) => {
  const event = band.events[item]
  const heading = new Date(event.start).toLocaleString("ru", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })
  const eventEfficiency = parseInt(event.efficiency * 100)
  const eventEfficiencyLost = parseInt(event.efficiencyLost * 100)
  const [pie, musicians] = (() => {
    let pie = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    }
    let musicians = []
    Object.keys(band.musicians).map((key) => {
      let bMus = band.musicians[key]
      let eMus = event.musicians?.[key]
      let eMusEfficiency = parseInt(eMus?.efficiency * 100) || 0
      if (eMus)
        musicians.push({
          key: key,
          name: bMus.name,
          color: bMus.color,
          efficiency: eMusEfficiency,
        })
      pie.labels.push(bMus.name)
      pie.datasets[0].data.push(eMusEfficiency)
      pie.datasets[0].backgroundColor.push(bMus.color)
    })
    pie.labels.push("Неиспользованно")
    pie.datasets[0].data.push(eventEfficiencyLost)
    pie.datasets[0].backgroundColor.push("#eee")
    return [pie, musicians]
  })()
  return (
    <>
      <Heading
        as="h3"
        size="sm"
        gridColumn="1/3"
        mb={2}
        css={{
          "&:first-letter": {
            textTransform: "uppercase",
          },
        }}
      >
        {heading}
      </Heading>
      <Box mb={4} mr={2}>
        <Pie
          data={pie}
          options={{
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
        <Text textAlign="center" pl={2} pt={2}>
          {eventEfficiency}%
        </Text>
      </Box>
      <Box mb={4}>
        {musicians.map((musician) => (
          <Flex key={musician.key}>
            <StarIcon color={musician.color} mr={1} />
            <Text fontSize={12}>
              {musician.name} {musician.efficiency}%
            </Text>
          </Flex>
        ))}
        <Text fontSize={12} bg="#eee" p={2} mt={2} maxW={360}>
          {event.comment}
        </Text>
      </Box>
    </>
  )
}
const Events = ({ band }) => (
  <Grid>
    <Heading as="h2" size="md" mb={3}>
      Репетиции
    </Heading>
    <Grid templateColumns="140px 1fr">
      {band.events &&
        Object.keys(band.events)
          .reverse()
          .map((key) => <Event key={key} band={band} item={key} />)}
    </Grid>
  </Grid>
)

export default function Band() {
  const band = useLoaderData()
  return (
    <>
      <Heading as="h1" textAlign="center" mb={3} textTransform="uppercase">
        {band.name}
      </Heading>
      <Grid gap={6} alignContent="start">
        <Activity band={band} />
        <Musicians band={band} />
        <Events band={band} />
      </Grid>
    </>
  )
}
