
import './App.css'
import {Route, Routes, Navigate} from "react-router-dom"
import {useContext} from "react"
import Homepage from './pages/Homepage'
import Registerpage from './pages/Registerpage'
import Otppage from './pages/Otppage'
import Login from './pages/Login'
import GoogleCallback from './pages/GoogleCallback'
import { ThemeProvider } from './context/Themeprovider'
import userContext from './context/Usercontext'

function App() {
  const { currentUser, authToken, isAuthLoading } = useContext(userContext)
  const home = isAuthLoading
    ? <main className="auth-page flex min-h-screen items-center justify-center text-white">Checking your session…</main>
    : currentUser ? <Homepage /> : <Navigate to="/login" replace />
  const authPage = (page) => {
    if (isAuthLoading) {
      return <main className="auth-page flex min-h-screen items-center justify-center text-white">Checking your session…</main>
    }
    return authToken && currentUser ? <Navigate to="/" replace /> : page
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route path='/' element={home}/>
        <Route path='/register' element={authPage(<Registerpage />)}/>
        <Route path='/otp' element={authPage(<Otppage />)}/>
        <Route path='/login' element={authPage(<Login />)}/>
        <Route path='/auth/callback' element={authPage(<GoogleCallback />)}/>
        <Route path='*' element={<Navigate to="/" replace />}/>
      </Routes>
    </ThemeProvider>
  )
}

export default App
