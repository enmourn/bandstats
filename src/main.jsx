import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { initializeApp } from "firebase/app"
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

import Root from './routes/root'
import Index, {
  loader as indexLoader } from './routes/index'
import Auth, {
  loader as authLoader,
  action as authAction } from './routes/auth'
import Registration,  {
  loader as registrationLoader,
  action as registrationAction } from './routes/registration'
import Admin, {
  loader as adminLoader,
  action as adminAction } from './routes/admin'

const firebaseConfig = {
  apiKey: "AIzaSyC2AO9CBep5oe7pz-eJYLaX-iFXjE9aWZ0",
  authDomain: "bandstats-d5330.firebaseapp.com",
  projectId: "bandstats-d5330",
  storageBucket: "bandstats-d5330.appspot.com",
  messagingSenderId: "240207236904",
  appId: "1:240207236904:web:231a711ca3b0afa0028a1d",
  measurementId: "G-E69WTB8DNE"
};
const app = initializeApp(firebaseConfig);

const theme = extendTheme({
  components: {
    Checkbox: {
      variants: {
        "white": {
          control: {
            bg: "white"
          }
        }
      }
    }
  }
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Index />,
        loader: indexLoader
      },
      {
        path: 'auth',
        element: <Auth />,
        loader: authLoader,
        action: authAction
      },
      {
        path: 'registration',
        element: <Registration />,
        loader: registrationLoader,
        action: registrationAction
      },
      {
        path: ':bandKey/admin',
        element: <Admin />,
        loader: adminLoader,
        action: adminAction
      }
    ]
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
)
