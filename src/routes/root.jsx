import { Outlet, useNavigation } from 'react-router-dom'
import { Grid, Flex, Spinner } from '@chakra-ui/react'

export default function Root() {
  const navigation = useNavigation()
  return (
    <Grid w='100vw' h='100vh' p={4}>
      <Outlet />
      <Flex
        pos='fixed'
        zIndex='1000'
        left='0'
        top='0'
        w='100vw'
        h='100vh'
        bg='rgba(255,255,255,0.5)'
        backdropFilter='blur(3px)'
        justifyContent='center'
        alignItems='center'
        display={navigation.state != 'idle' ? 'flex': 'none'}
      >
        <Spinner/>
      </Flex>
    </Grid>
  )
}