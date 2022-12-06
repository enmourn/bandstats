import { useActionData, Form, redirect } from "react-router-dom"
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword as createUser,
  updateProfile,
  sendEmailVerification,
  signOut
} from "firebase/auth"
import { useEffect, useState } from "react"
import { firebaseErrorParse } from '../libs/functions'
import { ViewOffIcon, ViewIcon } from '@chakra-ui/icons'
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
  const user = await new Promise(resolve =>
    onAuthStateChanged(getAuth(), user => resolve(user)))
  return user && user.emailVerified && redirect('/')
}

export async function action({ request }) {
  const formData = await request.formData()
  const auth = getAuth()
  if (formData.get('password') !== formData.get('confirmation')) {
    return {
      error: true,
      description: 'Пароль и повтор пароля не совпадают.'
    }
  }
  try {
    await createUser(auth, formData.get('email'), formData.get('password'))
    await updateProfile(auth.currentUser, {displayName: formData.get('name')})
    await sendEmailVerification(auth.currentUser)
    await signOut(auth)
    return redirect(`/auth?new=${formData.get('email')}`)
  } catch (error) {    
    return {
      error: true,
      description: firebaseErrorParse(error)
    }    
  }
}

export default function Registration() {
  const actionData = useActionData()
  const toast = useToast()
  const [pass, setPass] = useState([true, true])
  useEffect(() => {
    actionData && actionData.error && toast({
      status: 'error',
      title: 'Ошибка при регистрации',
      description: actionData.description,
      duration: 4000,
      isClosable: true,
    })
  }, [actionData])
  return (
    <>
    <Heading as='h1' textAlign='center' mb={3}>РЕГИСТРАЦИЯ</Heading>
    <Form method='post' style={{margin: 'auto'}}>
      <Grid gap={2}>
        <FormControl>
          <FormLabel>Email:</FormLabel>
          <Input name='email' required/>
        </FormControl>
        <FormControl>
          <FormLabel>Имя:</FormLabel>
          <Input name='name' required/>
        </FormControl>
        <FormControl>
          <FormLabel>Пароль:</FormLabel>
          <InputGroup>
            <Input type={pass[0] ? 'password' : 'text'} name='password' required/>
            <InputRightElement>
              <Button onClick={e => {setPass([!pass[0], pass[1]])}} variant='unstyled'>
                {pass[0] ? <ViewIcon color='gray.200'/> : <ViewOffIcon color='gray.200'/>}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel>Повтор пароля:</FormLabel>
          <InputGroup>
            <Input type={pass[1] ? 'password' : 'text'} name='confirmation' required/>
            <InputRightElement>
              <Button onClick={e => {setPass([pass[0], !pass[1]])}} variant='unstyled'>
                {pass[1] ? <ViewIcon color='gray.200'/> : <ViewOffIcon color='gray.200'/>}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Button type='submit' mt={6} colorScheme='teal'>Регистрация</Button>
      </Grid>
    </Form>
    </>
  )
}