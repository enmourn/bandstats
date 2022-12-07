import { useState, useEffect } from 'react'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref, get, update, onValue, off } from "firebase/database";
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
  return user ?
    <Grid justifyItems='center' mb={5}>
      <Text>{user.displayName}</Text>
      <Text>{user.email}</Text>
    </Grid>
    :
    <Flex justifyContent='center' mb={5}>
      <Link to='auth' as={RouterLink}>Вход</Link>
      <Text ml={2} mr={2}>|</Text>
      <Link to='registration' as={RouterLink}>Регистрация</Link>
    </Flex>
}
const Access = ({user, toast}) => {
  const [accessBands, setAccessBands] = useState([])
  useEffect(() => {
    const db = getDatabase()
    const accessRef = ref(db, 'access')
    onValue(accessRef, async (snapshot) => {
      let access = snapshot.val()
      let accessBands = []
      for (let uid in access) {
        let name = await get(ref(db, `bands/${uid}/name`))
          .then(res => res.val())
        accessBands.push({uid, name, access: access[uid]})
      }
      setAccessBands(accessBands)
    })
    return () => {
      off(accessRef)
    }
  }, [])
  return (
    <Grid mt={2} m='auto'>
      <AccessBand accessBand={{
        uid: 'new',
        name: 'Новый проект',
        access: {all: 'user'}
      }} />
      {accessBands.map(accessBand =>
        <AccessBand
          key={accessBand.uid}
          accessBand={accessBand}
          user={user}
          toast={toast}
        />
      )}
    </Grid>
  )
}
const AccessBand = ({accessBand, user, toast}) => {
  const navigate = useNavigate()
  const submit = useSubmit()
  const right = (
    user && accessBand.access[user.uid] ||
    accessBand.access['all']
  )
  const access = {
    view: right === 'user' || right === 'admin',
    edit: right === 'admin',
    request: right === 'request'
  }
  const handleClick = () => {
    if (access.view) return navigate(`/${accessBand.uid}`)
    if (access.request) return toast(toastAccessRequest(accessBand.name))
    if (!user) return toast(toastAuthError(accessBand.name))
    if (confirm('У Вас нет доступа к данному проекту. Запросить доступ?')) {
      let formData = new FormData()
      formData.append('bandUid', accessBand.uid)
      formData.append('bandName', accessBand.name)
      formData.append('userUid', user.uid)
      return submit(formData, {method: 'post'})
    }
  }
  const handleClickAdmin = () => {
    navigate(`/${accessBand.uid}/admin`)
  }
  return (
    <Flex mb={2}>
      <Button 
        rightIcon={access.view ? <UnlockIcon /> : <LockIcon />}
        colorScheme={access.view ? 'teal' : null}
        flex={1}
        onClick={handleClick}
      >
        <Text textTransform='uppercase'>{accessBand.name}</Text>
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
  const user = await new Promise(resolve =>
    onAuthStateChanged(getAuth(), user => resolve(user)))
  return user
}
export async function indexAction({request}) {
  const db = getDatabase()
  const formData = await request.formData()
  const bandUid = formData.get('bandUid')
  const bandName = formData.get('bandName')
  const userUid = formData.get('userUid')
  await update(ref(db, `access/${bandUid}`), {[userUid]: 'request'})
  localStorage.setItem('toastAccessRequest', bandName)
  return redirect('/')
}
export function Index() {
  const user = useLoaderData()
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
    <Access user={user} toast={toast}/>
    </>
  )
}