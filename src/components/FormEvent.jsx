import { useState } from 'react'
import { useSubmit, Form } from "react-router-dom"
import { useConfirm } from '../components/useConfirm'
import TextareaAutosize from 'react-textarea-autosize'
import {
  FormControl,
  FormLabel,
  Input,
  Grid,
  Text,
  Textarea,
  GridItem,
  Checkbox,
  Button,
  VisuallyHiddenInput,
  useToast
} from '@chakra-ui/react'

const Musician = ({musician}) => {
  const [checked, setChecked] = useState(musician.start)
  return (
    <Grid>
      <Checkbox
        isChecked={checked}
        colorScheme='teal'
        variant='white'
        onChange={e => setChecked(!checked)}
        >{musician.name}</Checkbox>
      {checked && 
        <Grid templateColumns='repeat(2, 1fr)' gap={2}>
          <VisuallyHiddenInput name='musician' defaultValue={musician.key} />
          <FormControl>
            <FormLabel mb={0}>Приход:</FormLabel>
            <Input
              type='time'
              name={`${musician.key}-start`}
              defaultValue={musician.start}
              isRequired
              bg='white'
            />
        </FormControl>
        <FormControl>
            <FormLabel mb={0}>Уход:</FormLabel>
            <Input
              type='time'
              name={`${musician.key}-end`}
              defaultValue={musician.end}
              isRequired
              bg='white'
            />
        </FormControl>
        </Grid>
      }
    </Grid>
  )
}

export default function FormEvent({event, musicians, bandUid}) {
  const submit = useSubmit()
  const toast = useToast()
  const {isConfirmed} = useConfirm()
  const checkboxes = Object.keys(musicians).map(key => {
    let musician = {...musicians[key], key: key}
    event?.musicians?.[key] && (musician = {...event.musicians[key], ...musician})
    return musician
  })
  const title = (new Date(event.date)).toLocaleString("ru", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const handleDelete = async (e) => {
    if (await isConfirmed('Удалить статистику репетиции?')) {
      if (bandUid == 'temniyel') {
        return toast({
          status: 'error',
          title: 'Ошибка при удалении',
          description: 'Темный Эль - демонстрационный проект, в нем нельзя ничего удалять.'
        })
      }
      let formData = new FormData(e.target.form)
      formData.set('action', 'deleteEvent')
      submit(formData, {method: 'post'})
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    let formData = new FormData(e.target)
    if (!formData.get('musician')) {
      return toast({
        status: 'error',
        title: 'Ошибка при сохранении',
        description: 'Укажите хотя бы одного участника'
      })
    }
    submit(formData, {method: 'post'})
  }
  return (
    <Form key={event.date} method='post' onSubmit={handleSubmit}>
      <VisuallyHiddenInput name='action' defaultValue='updateEvent' />
      <VisuallyHiddenInput name='bandUid' defaultValue={bandUid} />
      <VisuallyHiddenInput name='date' defaultValue={event.date} />
      <Text
        css={{"&:first-letter": {textTransform: "uppercase"}}}
        textAlign='center'
        fontSize={22}
        mb={2}
      >{title}</Text>
      <Grid
        templateColumns='repeat(2, 1fr)'
        gridGap={2}
        rowGap={4}
        p={4}
        borderRadius={4}
        bg='gray.100'
      >
        <FormControl>
          <FormLabel>Начало:</FormLabel>
          <Input
            type='time'
            name='start'
            defaultValue={event.start}
            isRequired
            bg='white'
          />
        </FormControl>
        <FormControl>
          <FormLabel>Окончание:</FormLabel>
          <Input
          type='time'
          name='end'
          defaultValue={event.end}
          isRequired
          bg='white'
        />
        </FormControl>
        <GridItem colSpan={2}>
          <FormControl>
            <FormLabel>Участники:</FormLabel>
            <Grid gap={3}>
              {checkboxes.map(item => 
                <Musician key={item.key} musician={item} />
              )}
            </Grid>
          </FormControl>
        </GridItem>
        <GridItem colSpan={2}>
          <FormControl>
            <FormLabel>Комментарий:</FormLabel>
            <Textarea
              name='comment'
              as={TextareaAutosize}
              defaultValue={event.comment}
              resize='none'
              bg='white'/>
          </FormControl>
        </GridItem>
        <GridItem colSpan={2}>
          <Button type='submit' colorScheme='teal'>
            Сохранить
          </Button>
          {event.start &&
            <Button onClick={handleDelete} colorScheme='red' ml={2}>
              Удалить
            </Button>
          }
        </GridItem>
      </Grid>  
    </Form>
  )
}