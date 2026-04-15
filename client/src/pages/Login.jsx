// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevents the page from refreshing
        setError(''); // Clear old errors
        
        try {
            // 1. Send the data to your Node.js backend
            const response = await API.post('/users/login', { username, password });
            
            // 2. Success! Save the VIP Badge and Role to the browser wallet
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            
            // 3. Redirect him to his Inventory Dashboard
            navigate('/dashboard');
            
        } catch (err) {
            console.error(err);
            setError('Invalid username or password!');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
            <h1>Bharat Automobiles</h1>
            <h3>Owner Login</h3>
            
            <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username: </label><br/>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Password: </label><br/>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;