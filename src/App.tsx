import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OrganisationDirectoryPage } from './pages/OrganisationDirectoryPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrganisationDirectoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
