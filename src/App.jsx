import { Route, Routes } from 'react-router-dom'
import TreePage from './pages/TreePage.jsx'
import PoliticianPage from './pages/PoliticianPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TreePage />} />
      <Route path="/politico/:id" element={<PoliticianPage />} />
    </Routes>
  )
}
