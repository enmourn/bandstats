import { ArrowForwardIcon, ArrowBackIcon } from '@chakra-ui/icons'
import {
  Text,
  Grid,
  GridItem,
  Flex,
  Button,
  Box
} from '@chakra-ui/react'

export default function Calendar({year, month, dates, prev, next, click}) {
  month--
  const calendar = (() => {
    let daysInMonth= (new Date(year, month + 1, 0)).getDate()
    let calendar = {}
    for (let day = 1; day <= daysInMonth; day++) calendar[day] = null
    return dates ? {...calendar, ...dates} : calendar
  })()
  const offset = (() => {
    let day = (new Date(year, month)).getDay()
    return day == 0 ? 6 : day - 1
  })()
  const title = (() => {
    let dt = new Date(year, month)
    let res = dt.toLocaleString("ru", {month: 'long'}) + ' ' + dt.getFullYear()
    return res[0].toUpperCase() + res.slice(1)
  })()
  return (
      <Grid
      templateColumns="repeat(7, auto)"
      alignContent="start"
      justifyItems="center"
      gap={1}
    >
      <GridItem colSpan={7} fontSize={26} mb={2}>
        <Flex alignItems="center">
          {prev && 
            <Button size="sm" onClick={e => prev()}>
              <ArrowBackIcon/>
            </Button>
          }
          <Text m="0 20px">{title}</Text>
          {next &&
            <Button size="sm" onClick={e => next()}>
              <ArrowForwardIcon/>
            </Button>
          }
        </Flex>
      </GridItem>
      <Box>Пн</Box>
      <Box>Вт</Box>
      <Box>Ср</Box>
      <Box>Чт</Box>
      <Box>Пт</Box>
      <Box>Сб</Box>
      <Box>Вс</Box>
      {offset ? [...Array(offset)].map((item, index) => 
        <Box justifySelf="stretch" key={index}></Box>
      ) : null}
      {Object.keys(calendar).map(key => 
        <Button
          key={key}
          colorScheme={calendar[key] ? 'teal': null}
          justifySelf="stretch"
          onClick={click ? e => click(new Date(year, month, key)): null}
        >{key}</Button>
      )}
    </Grid>
  )
}