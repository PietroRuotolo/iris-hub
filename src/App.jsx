import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SoftwarePlaceholder from './pages/SoftwarePlaceholder'
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
              element={<SoftwarePlaceholder software={software} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
