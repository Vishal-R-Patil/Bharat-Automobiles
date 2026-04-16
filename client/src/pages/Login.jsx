import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true); 
        try {
            const response = await API.post('/users/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            navigate('/dashboard'); 
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Login failed! Check credentials.");
            setIsLoading(false); 
        }
    };

    return (
        <div className="login-wrapper">
            <form onSubmit={handleLogin} className="login-card">
                <div className="text-center mb-3">
                    <h2 className="m-0 text-primary">Bharat Automobiles</h2>
                    <p className="text-muted m-0">Authorized Dealer Portal</p>
                </div>
                
                <div>
                    <label>Username</label>
                    <input 
                        type="text" 
                        placeholder="Enter username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        className="input-field"
                    />
                </div>
                
                <div>
                    <label>Password</label>
                    <input 
                        type="password" 
                        placeholder="Enter password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="input-field"
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className={`btn btn-primary mt-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ padding: '12px', width: '100%' }}
                >
                    {isLoading ? '⏳ Verifying...' : 'Login to Dashboard'}
                </button>
            </form>
        </div>
    );
}

export default Login;