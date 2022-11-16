export function firebaseErrorParse(error) {
  switch (error.code) {
    case 'auth/invalid-email': 
      return 'Неверный логин, используйте email' 
    case 'auth/user-not-found': 
      return 'Неверный логин, пользователь не найден'
    case 'auth/wrong-password':
      return 'Неверный пароль'
    case 'auth/weak-password':
      return 'Короткий пароль, используйте более 6 символов'
    case 'auth/email-already-in-use':
      return 'Пользователь с таким email уже зарегистрирован'
    default:
      return error.message
  }
}