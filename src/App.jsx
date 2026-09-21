import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SoftwareDetalhe from './pages/SoftwareDetalhe'
import NotFound from './pages/NotFound'
import Sessoes from './pages/Sessoes'
import Laudo from './pages/Laudo'
import Resultado from './pages/Resultado'
import { SOFTWARES } from './data/softwares'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Aberta pelo QR code no celular: sem menu lateral. */}
        <Route path="/resultado" element={<Resultado />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/sessoes" element={<Sessoes />} />
          <Route path="/laudo" element={<Laudo />} />
          {SOFTWARES.map((software) => (
            <Route
              key={software.id}
              path={software.rota}
              element={<SoftwareDetalhe software={software} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
