import { useRef } from 'react'
import { useConfirm } from './useConfirm'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react'

export const ConfirmModal = () => {
  const cancelRef = useRef()
  const {
    prompt = '',
    isOpen = false,
    proceed,
    cancel
  } = useConfirm()
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={cancel}
    >
      <AlertDialogOverlay>
        <AlertDialogContent ml={4} mr={4}>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
          </AlertDialogHeader>
          <AlertDialogBody>{prompt}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={cancel}>
              Отмена
            </Button>
            <Button colorScheme='red' onClick={proceed} ml={3}>
              ОК
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
