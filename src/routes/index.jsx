import { useLoaderData, Link as RouterLink } from 'react-router-dom'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get } from "firebase/database";
import {
  Heading,
  Text,
  Grid,
  Flex,
  Link,
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

const BandRole = ({ link, band }) => (
  <>
  {(band.rights == 'user' || band.rights == 'admin') && 
    <Link as={RouterLink} to={link}>
      <Text as='span' textTransform='uppercase'>{band.name}</Text>
    </Link>
  }
  {band.rights == 'admin' &&
    <Link as={RouterLink} to={link + '/admin'}>
      <Text as='span' textTransform='uppercase'>{band.name}</Text>
      <Text as='span'> (админ)</Text>
    </Link>
  }
  </>
)

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
            <Grid justifyItems='center'>
              <Text mt={12} mb={2}>Доступные проекты:</Text>
              {Object.keys(role.bands).map(key => 
                <BandRole key={key} link={key} band={role.bands[key]} />
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