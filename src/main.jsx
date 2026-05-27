import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Precargar iconos MDI offline — elimina el flash al navegar
import { addCollection } from '@iconify/react';
import mdi from '@iconify-json/mdi/icons.json';
addCollection(mdi);

// Siempre iniciar en modo claro
// Eliminado para permitir persistencia del modo oscuro

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
