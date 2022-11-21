import { useActionData, Form, redirect } from "react-router-dom"
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth"
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
} from '@chakra-ui/react'

export async function loader() {
  return await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user))) &&
    redirect('/')
}

export async function action({ request }) {
  const auth = getAuth();
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')
  return await signInWithEmailAndPassword(auth, email, password)
    .catch(error => {
      return {
        error: true,
        description: firebaseErrorParse(error)
      }
    })
}

export default function Auth() {
  const [pass, setPass] = useState(true)
  const actionData = useActionData()
  const toast = useToast()
  useEffect(() => {
    actionData && actionData.error && toast({
      status: 'error',
      title: 'Что-то пошло не так...',
      description: actionData.description,
      duration: 4000,
      isClosable: true,
    })
  }, [actionData])
  return (
    <Grid alignContent='center' justifyContent='center'>
      <Form method='post'>
        <Grid gap={2}>
          <FormControl>
            <FormLabel>Email:</FormLabel>
            <Input name='email' required/>
          </FormControl>
          <FormControl>
            <FormLabel>Пароль:</FormLabel>
            <InputGroup>
              <Input type={pass ? 'password' : 'text'} name='password' required/>
              <InputRightElement>
                <Button onClick={e => {setPass(!pass)}} variant='unstyled'>
                  {pass ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <Button type='submit' mt={6}>Вход</Button>
        </Grid>
      </Form>
    </Grid>
  )
}