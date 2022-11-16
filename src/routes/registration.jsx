import { redirect, Form, useActionData } from "react-router-dom"
import { getAuth, createUserWithEmailAndPassword as createUser } from "firebase/auth"
import { getDatabase, ref, push, set, update } from "firebase/database";
import { useState, useEffect } from "react"
import { SmallAddIcon, SmallCloseIcon } from '@chakra-ui/icons'
import { firebaseErrorParse } from '../libs/functions'
import {
  Grid,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  IconButton,
  Flex
} from '@chakra-ui/react'

export async function action({ request }) {
  const formData = await request.formData()
  const form = Object.fromEntries(formData.entries())
  form.musicians = formData.getAll('musician')
  if (form.password !== form.confirmation) {
    return {error: {message: 'Пароль и повтор пароля не совпадают'}}
  }
  try {
    const db = getDatabase()
    const user = (await createUser(getAuth(), form.email, form.password)).user
    const bandKey = push(ref(db, 'bands'), {name: form.band, admin: user.uid}).key
    set(ref(db, `quickBands/${bandKey}`), {name: form.band})
    form.musicians.map(item => {
      push(ref(db, `bands/${bandKey}/musicians`), {name: item})
    })
    return redirect(`/admin/${user.uid}`)
  } catch (error) {
    return {error: error}
  }
}

export default function Registration() {
  const [musicians, setMusicians] = useState([(new Date).getTime()])
  const actionData = useActionData()
  const toast = useToast()
  const addMusician = () => setMusicians([...musicians, (new Date).getTime()])
  const removeMusician = index => {
    let newMusicians = [...musicians]
    newMusicians.splice(index, 1);
    setMusicians(newMusicians)
  }
  useEffect(() => {
    if (actionData && actionData.error) {
      toast({status: 'error', title: firebaseErrorParse(actionData.error)})
    }
  }, [actionData])
  return (
    <Form method='post'>
      <Grid gap={2} maxW='460' m='0 auto'>
        <FormControl>
          <FormLabel>Логин:</FormLabel>
          <Input name='email' required/>
        </FormControl>
        <FormControl>
          <FormLabel>Пароль:</FormLabel>
          <Input name='password' type='password' required />
        </FormControl>
        <FormControl>
          <FormLabel>Повтор пароля:</FormLabel>
          <Input name='confirmation' type='password' required />
        </FormControl>
        <FormControl>
          <FormLabel>Название группы:</FormLabel>
          <Input name='band' required />
        </FormControl>
        <FormControl>
          <FormLabel>Музыканты:</FormLabel>
          {musicians.map((item, index) => 
            <Flex key={item}>
              <Input name='musician' mb={2} required/>
              <IconButton
                icon={<SmallCloseIcon />}
                onClick={e => {removeMusician(index)}}
                ml={2}
              />
            </Flex>
          )}
          <IconButton icon={<SmallAddIcon />} onClick={addMusician}/>
        </FormControl>
        {!!musicians.length && <Button type='submit' mt={6}>Регистрация</Button>}
      </Grid>
    </Form>
  )
}