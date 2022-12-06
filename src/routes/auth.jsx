import { useActionData, Form, redirect } from "react-router-dom"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword as signIn,
  signOut
} from "firebase/auth"
import { useState, useEffect } from "react"
import { ViewOffIcon, ViewIcon } from '@chakra-ui/icons'
import { firebaseErrorParse } from '../libs/functions'
import {
  Grid,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  useToast,
  Heading,
} from '@chakra-ui/react'

export async function loader() {
  return await new Promise(resolve => onAuthStateChanged(
    getAuth(), user => resolve(user?.emailVerified && redirect('/'))))
}

export async function action({ request }) {
  const formData = await request.formData()
  const auth = getAuth()
  try {
    await signIn(auth, formData.get('email'), formData.get('password'))
    if (!auth.currentUser?.emailVerified) {
      await signOut(auth)
      return {
        error: true,
        description: 'Электронный адрес не подтвержден.'
      }
    }
  } catch (error) {
    return {
      error: true,
      description: firebaseErrorParse(error)
    }
  }
}

export default function Auth() {
  const [pass, setPass] = useState(true)
  const actionData = useActionData()
  const toast = useToast()
  const email = (new URLSearchParams(location.search)).get('new')
  useEffect(() => {
    email && toast({
      status: 'success',
      title: 'Создан новый аккаунт',
      description: `Для входа необходимо подтвердить электронный адрес,
        перейдя по ссылке в письме. Проверьте почту ${email}, письмо 
        может быть в папке со спамом.`,
      duration: null,
      isClosable: true
    })
  }, [])
  useEffect(() => {
    return toast.closeAll
  }, [email])
  useEffect(() => {
    actionData && actionData.error && toast({
      status: 'error',
      title: 'Ошибка при авторизации',
      description: actionData.description,
      duration: 4000,
      isClosable: true,
    })
  }, [actionData])
  return (
    <>
    <Heading as='h1' textAlign='center' mb={3}>ВХОД</Heading>
    <Form method='post' style={{margin: 'auto'}}>
      <Grid gap={2}>
        <FormControl>
          <FormLabel>Email:</FormLabel>
          <Input name='email' defaultValue={email} required/>
        </FormControl>
        <FormControl>
          <FormLabel>Пароль:</FormLabel>
          <InputGroup>
            <Input type={pass ? 'password' : 'text'} name='password' required/>
            <InputRightElement>
              <Button onClick={e => {setPass(!pass)}} variant='unstyled'>
                {pass ? <ViewIcon color='gray.200'/> : <ViewOffIcon color='gray.200'/>}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Button type='submit' mt={6} colorScheme='teal'>Вход</Button>
      </Grid>
    </Form>
    </>
  )
}