import { Outlet, useNavigation } from 'react-router-dom'
import { Grid } from '@chakra-ui/react'
import { Loader } from '../components/Loader'
import { ConfirmModal } from '../components/ConfirmModal'

export default function Root() {
  const navigation = useNavigation()
  return (
    <Grid w='100%' maxW={758} p={4} m='auto'>
      <Outlet />
      <Loader visible={navigation.state != 'idle'} />
      <ConfirmModal />
    </Grid>
  )
}