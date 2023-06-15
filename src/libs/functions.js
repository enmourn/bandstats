export function firebaseErrorParse(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Неверный адрес электронной почты"
    case "auth/user-not-found":
      return "Пользователь не найден"
    case "auth/wrong-password":
      return "Неверный пароль"
    case "auth/weak-password":
      return "Слабый пароль"
    case "auth/email-already-in-use":
      return "Этот электронный адрес уже занят"
    case "auth/network-request-failed":
      return "Сетевой запрос не выполнен"
    default:
      return error.message
  }
}
export function getEventMusicians(bandMusicians, eventDate) {
  let musicians = {}
  for (let key in bandMusicians) {
    let musician = bandMusicians[key]
    if (eventDate < new Date(musician.joined)) continue
    if (musician.left && eventDate > new Date(musician.left)) continue
    musicians[key] = musician
  }
  return musicians
}
