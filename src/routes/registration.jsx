import { useActionData, Form, redirect } from "react-router-dom"
import {
  getAuth,
  onAuthStateChanged,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updateProfile,
  updatePassword
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
  VisuallyHiddenInput
} from '@chakra-ui/react'

export async function loader() {
  return await new Promise(resolve => 
    onAuthStateChanged(getAuth(), user => resolve(user))) &&
    redirect('/')
}

export async function action({ request }) {
  const auth = getAuth();
  const formData = await request.formData()
  try {
    if (formData.has('sendlink')) {
      const actionCodeSettings = {url: location.href, handleCodeInApp: true}
      const email = formData.get('email')
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      localStorage.setItem('firebase-auth-email', email)
      return {
        success: true,
        description: `Проверьте вашу электронную почту ${email}`
      }
    } else {
      if (formData.get('password') !== formData.get('confirmation')) {
        return {
          error: true,
          description: 'Пароль и повтор пароля не совпадают'
        }
      }
      await signInWithEmailLink(auth, formData.get('email'), location.href)
      await updateProfile(auth.currentUser, {displayName: formData.get('name')})
      await updatePassword(auth.currentUser, formData.get('password'))
      localStorage.removeItem('firebase-auth-email')
      return redirect('/')
    }
  } catch (error) {
    return {
      error: true,
      description: firebaseErrorParse(error)
    }    
  }
}

export default function Registration() {
  const auth = getAuth();
  const signIn = isSignInWithEmailLink(auth, window.location.href)
  const actionData = useActionData()
  const toast = useToast()
  const email = localStorage.getItem('firebase-auth-email')
  const [pass, setPass] = useState([true, true])
  useEffect(() => {
    actionData && actionData.error && toast({
      status: 'error',
      title: 'Что-то пошло не так...',
      description: actionData.description,
      duration: 4000,
      isClosable: true,
    })
    actionData && actionData.success && toast({
      status: 'success',
      title: 'Отлично!',
      description: actionData.description,
      duration: null,
      isClosable: true
    })
  }, [actionData])
  return (
    <Grid alignContent='center' justifyContent='center'>
      {signIn ? (
        <Form method='post'>
          <Grid gap={2}>
            <FormControl>
              <FormLabel>Email:</FormLabel>
              <Input name='email' defaultValue={email} required/>
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
                    {pass[0] ? <ViewIcon /> : <ViewOffIcon />}
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
                    {pass[1] ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Button type='submit' mt={6}>Регистрация</Button>
          </Grid>
        </Form>
        ) : (
        <Form method='post'>
          <VisuallyHiddenInput name='sendlink'/>
          <Grid gap={2}>
            <FormControl>
              <FormLabel>Email:</FormLabel>
              <Input name='email' required/>
            </FormControl>
            { (!actionData || actionData.error) &&
              <Button type='submit' mt={2}>Получить ссылку</Button>
            }
          </Grid>
        </Form>
      )}
    </Grid>
  )
}