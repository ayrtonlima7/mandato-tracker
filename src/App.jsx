import { Route, Routes } from 'react-router-dom'
import MapPage from './pages/MapPage.jsx'
import PoliticianPage from './pages/PoliticianPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/politico/:id" element={<PoliticianPage />} />
    </Routes>
  )
}
