import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Comprovante } from './pages/Comprovante'
import { Confirmacao } from './pages/Confirmacao'
import { Consulta } from './pages/Consulta'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Consulta />} />
          <Route path="confirmar" element={<Confirmacao />} />
          <Route path="comprovante" element={<Comprovante />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
