import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SoftwareDetalhe from './pages/SoftwareDetalhe'
import NotFound from './pages/NotFound'
import { SOFTWARES } from './data/softwares'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
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
