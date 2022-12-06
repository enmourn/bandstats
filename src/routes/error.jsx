import { useRouteError } from "react-router-dom";
import { Grid, Heading, Text } from '@chakra-ui/react'

export default function ErrorPage() {
  const error = useRouteError();
  return (
    <>
      <Heading as='h1' textAlign='center' mb={3}>{error.status}</Heading>
      <Text textAlign='center'>{error.statusText}</Text>
    </>
  )
}