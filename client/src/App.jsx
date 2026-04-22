import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Home from './pages/Home'
import './index.css';

// THE FRONTEND BOUNCER
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // If there is a token, let them see the children (Dashboard). If not, kick to /login.
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Wrap the Dashboard in our new Bouncer */}
        <Route
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/billing" element={
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;