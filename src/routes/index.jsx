import { useLoaderData, Link as RouterLink, useNavigate } from 'react-router-dom'
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
import { LockIcon, UnlockIcon } from '@chakra-ui/icons'

export async function loader() {
  const db = getDatabase()
  const user = await new Promise(resolve =>
    onAuthStateChanged(getAuth(), user => resolve(user)))
  const access = await get(ref(db, 'access')).
    then(snapshot => snapshot.val())
  return {user, access}
}

const Auth = ({user}) => {
  return (
    <Flex justifyContent='center' mb={5}>
      {user ? 
        <Text>{user.displayName || user.email}</Text>
        :
        <>
        <Link to='auth' as={RouterLink}>Вход</Link>
        <Text ml={2} mr={2}>|</Text>
        <Link to='registration' as={RouterLink}>Регистрация</Link>
        </>
      }
    </Flex>
  )
}
const Access = ({access, user}) => {
  const newBand = {
    name: 'Новый проект',
    users: {
      all: 'user'
    }
  }
  return (
    <Grid mt={2} m='auto'>
      <AccessBand band={newBand} uid='new' />
      {Object.keys(access).map(key =>
        <AccessBand key={key} band={access[key]} uid={key} user={user} />
      )}
    </Grid>
  )
}
const AccessBand = ({band, uid, user}) => {
  const navigate = useNavigate()
  const right = user && band.users[user.uid] || band.users['all']
  const access = {
    view: right === 'user' || right === 'admin',
    edit: right === 'admin',
    request: right === 'request'
  }
  const handleClick = () => {
    if (access.view) return navigate(`/${uid}`)
    if (access.request) {
      return alert('Запрос на доступ отправлен')
    }
    if (confirm('У Вас нет доступа к данному проекту. Запросить доступ?')) {
      
    }
  }
  const handleClickAdmin = () => {
    navigate(`/${uid}/admin`)
  }
  return (
    <Flex mb={2}>
      <Button 
        rightIcon={access.view ? <UnlockIcon /> : <LockIcon />}
        colorScheme={access.view ? 'teal' : null}
        flex={1}
        onClick={handleClick}
      >
        <Text textTransform='uppercase'>{band.name}</Text>
      </Button>
      {access.edit && 
        <Button
          rightIcon={<UnlockIcon />}
          colorScheme='red'
          ml={1}
          onClick={handleClickAdmin}
        >ADMIN</Button>
      }
    </Flex>
  )
}

export default function Index() {
  const {user, access} = useLoaderData()
  return (
    <>
    <Heading as='h1' textAlign='center' mb={3}>BANDSTATS</Heading>
    <Auth user={user} />
    <Access access={access} user={user}/>
    </>
  )
}