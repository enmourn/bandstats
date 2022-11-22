import { useLoaderData, Link as RouterLink } from 'react-router-dom'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get } from "firebase/database";
import {
  Heading,
  Text,
  Grid,
  Flex,
  Link,
  Button,
} from '@chakra-ui/react'

export async function loader() {
  const db = getDatabase()
  const user = await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user)))
  const role = user && await get(ref(db, `roles/${user.uid}`))
    .then(snapshot => snapshot?.val())
  if (role) for (let key in role.bands) {
    role.bands[key].name = await get(ref(db, `bands/${key}/name`))
      .then(snapshot => snapshot?.val())
  }
  return [user, role]
}

export default function Index() {
  const [user, role] = useLoaderData()
  return (
    <Grid gap={2} alignContent='center'>
      <Heading as='h1' textAlign='center'>BANDSTATS</Heading>
      {user ?
        <Grid justifyContent='center' justifyItems='center'>
          <Text>{user.displayName || user.email}</Text>
          <Text>Добро пожаловать!</Text>
          {role &&
            <Grid justifyItems='center' gap={2}>
              <Text mt={12}>Доступные проекты:</Text>
              {Object.keys(role.bands).map(key => 
                <Link as={RouterLink} key={key} to={key}>
                  <Button>{role.bands[key].name}</Button>
                </Link>
              )}
            </Grid>
          }
        </Grid>
      :
        <Flex justifyContent='center'>
          <Link to='auth' as={RouterLink}>Вход</Link>
          <Text ml={2} mr={2}>|</Text>
          <Link to='registration' as={RouterLink}>Регистрация</Link>
        </Flex>
      }
    </Grid>
  )
}