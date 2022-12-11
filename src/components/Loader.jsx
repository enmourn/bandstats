import { Flex, Spinner } from '@chakra-ui/react'

export function Loader({visible}) {
  return (
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
      display={visible ? 'flex' : 'none'}
      ><Spinner/>
    </Flex>
  )
}