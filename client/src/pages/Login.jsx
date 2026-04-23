import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { startSessionManager } from '../utils/sessionManager';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true); 
        try {
            const response = await API.post('/users/login', { username, password });
            localStorage.setItem('token', response.data.token);
            // 6hr expiry
            const expiry = Date.now() + 6* 60*60 * 1000;
            localStorage.setItem('expiry', expiry);
            //start session
            startSessionManager();
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
                    <p className="text-muted m-0">Login Portal</p>
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
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="input-field password-input"
                        />
                        <span 
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            className="password-toggle"
                        >
                            {showPassword ? (
                                // eye-off
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.73-1.31 1.81-2.71 3.17-3.94M9.9 4.24A10.94 10.94 0 0 1 12 5c5 0 9.27 3.89 11 7-1 1.8-2.7 3.9-5.06 5.94"/>
                                    <path d="M1 1l22 22"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            ) : (
                                // eye
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </span>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className={`btn btn-primary mt-3 login-btn ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? '⏳ Verifying...' : 'Login to Dashboard'}
                </button>
            </form>
        </div>
    );
}

export default Login;