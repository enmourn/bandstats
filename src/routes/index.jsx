import { useEffect } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, update } from "firebase/database";
import { LockIcon, UnlockIcon } from '@chakra-ui/icons'
import {
  useLoaderData,
  Link as RouterLink,
  useNavigate,
  useSubmit,
  redirect
} from 'react-router-dom'
import {
  Heading,
  Text,
  Grid,
  Flex,
  Link,
  Button,
  useToast
} from '@chakra-ui/react'

const toastAuthError = (bandName) => {
  return {
    status: 'error',
    title: 'Ошибка доступа',
    description: `Войдите или зарегистрируйтесь для доступа к проекту ${bandName}.` 
  }
}
const toastAccessRequest = (bandName) => {
  return {
    status: 'success',
    title: 'Запрос отправлен',
    description: `Ожидайте подтверждения запроса на доступ к проекту ${bandName}.` 
  }
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
const Access = ({access, user, toast}) => {
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
        <AccessBand
        key={key}
        band={access[key]}
        uid={key}
        user={user}
        toast={toast}/>
      )}
    </Grid>
  )
}
const AccessBand = ({band, uid, user, toast}) => {
  const navigate = useNavigate()
  const submit = useSubmit()
  const right = user && band.users[user.uid] || band.users['all']
  const access = {
    view: right === 'user' || right === 'admin',
    edit: right === 'admin',
    request: right === 'request'
  }
  const handleClick = () => {
    if (access.view) return navigate(`/${uid}`)
    if (access.request) return toast(toastAccessRequest(band.name))
    if (!user) return toast(toastAuthError(band.name))
    if (confirm('У Вас нет доступа к данному проекту. Запросить доступ?')) {
      let formData = new FormData()
      formData.append('bandUid', uid)
      formData.append('bandName', band.name)
      formData.append('userUid', user.uid)
      return submit(formData, {method: 'post'})
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

export async function indexLoader() {
  const db = getDatabase()
  const user = await new Promise(resolve =>
    onAuthStateChanged(getAuth(), user => resolve(user)))
  const access = await get(ref(db, 'access')).then(snapshot => snapshot.val())
  return {user, access}
}
export async function indexAction({request}) {
  const db = getDatabase()
  const formData = await request.formData()
  const bandUid = formData.get('bandUid')
  const bandName = formData.get('bandName')
  const userUid = formData.get('userUid')
  await update(ref(db, `access/${bandUid}/users`), {[userUid]: 'request'})
  localStorage.setItem('toastAccessRequest', bandName)
  return redirect('/')
}
export function Index() {
  const {user, access} = useLoaderData()
  const toast = useToast()
  useEffect(() => {
    let data = localStorage.getItem('toastAccessRequest')
    if (data) {
      toast(toastAccessRequest(data))
      localStorage.removeItem('toastAccessRequest')
    }
  })
  return (
    <>
    <Heading as='h1' textAlign='center' mb={3}>BANDSTATS</Heading>
    <Auth user={user} />
    <Access access={access} user={user} toast={toast}/>
    </>
  )
}