import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import Login from "./pages/Login"
import Dashboard from './pages/Dashboard';
import SignUp from './pages/SignUp'; 
import WhiteBoard from './pages/WhiteBoard';

function App() {
  
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/board/:code" element={<WhiteBoard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
