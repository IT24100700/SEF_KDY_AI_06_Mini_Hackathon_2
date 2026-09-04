import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RequestForm from './pages/RequestForm'
import DonateForm from './pages/DonateForm'
import RequestList from './pages/RequestList'
import DonationList from './pages/DonationList'
import About from './pages/About'
import Feedback from './pages/Feedback'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"             element={<Home />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/signup"       element={<Signup />} />
            <Route path="/request-aid"  element={<RequestForm />} />
            <Route path="/donate"       element={<DonateForm />} />
            <Route path="/requests"     element={<RequestList />} />
            <Route path="/donations"    element={<DonationList />} />
            <Route path="/about"        element={<About />} />
            <Route path="/feedback"     element={<Feedback />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HelpSriLanka — Built for Sri Lanka during the SEF Mini Hackathon
        </footer>
      </div>
    </BrowserRouter>
  )
}
