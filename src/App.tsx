import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CourseDesign from './pages/CourseDesign'
import RolePlay from './pages/RolePlay'
import MiniGames from './pages/MiniGames'
import AnonymousBox from './pages/AnonymousBox'
import FAQ from './pages/FAQ'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="course" element={<CourseDesign />} />
        <Route path="roleplay" element={<RolePlay />} />
        <Route path="games" element={<MiniGames />} />
        <Route path="questions" element={<AnonymousBox />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  )
}
