import { useLoaderData, Link as RouterLink, redirect} from 'react-router-dom'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import {
  Heading,
  Text,
  Grid,
  Flex,
  Link,
} from '@chakra-ui/react'

export async function loader() {
  return await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
}

export default function Index() {
  const user = useLoaderData()
  return (
    <Grid gap={4} alignContent='center'>
      <Heading as='h1' textAlign='center'>BANDSTATS</Heading>
      {user ? (
        <Grid justifyContent='center' justifyItems='center'>
          <Text>{user.displayName || user.email}</Text>
          <Text>Добро пожаловать!</Text>
        </Grid>
      ) : (
        <Flex justifyContent='center'>
          <Link to='auth' as={RouterLink}>Вход</Link>
          <Text ml={2} mr={2}>|</Text>
          <Link to='registration' as={RouterLink}>Регистрация</Link>
        </Flex>
      )}
    </Grid>
  )
}