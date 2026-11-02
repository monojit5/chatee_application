import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import Userprovider from './context/Userprovider.jsx';
import Chatprovider from './context/Chatprovider.jsx';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    <Userprovider>
    <Chatprovider>
    <App />
    <Toaster/>
    </Chatprovider>
    </Userprovider>
  </StrictMode>
  </BrowserRouter>
)
