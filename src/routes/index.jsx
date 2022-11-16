import { useLoaderData, Link as RouterLink } from 'react-router-dom'
import {
  Heading,
  Text,
  Grid,
  Flex,
  Link,
} from '@chakra-ui/react'

export default function Index() {
  const user = useLoaderData()
  return (
    <Grid gap={4}>
      <Heading as='h1' textAlign='center'>BANDSTATS</Heading>
      <Flex w='100%' justifyContent='center'>
        <Link to='auth' as={RouterLink}>Вход</Link>
        <Text ml={2} mr={2}>|</Text>
        <Link to='registration' as={RouterLink}>Регистрация</Link>
      </Flex>
    </Grid>
  )
}