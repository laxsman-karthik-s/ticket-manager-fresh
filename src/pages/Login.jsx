import { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: '#f1f5f9' }}>
      <div
        className="shadow-lg p-5 bg-white rounded-4"
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <h3 className="text-center text-primary fw-bold mb-4">🔐 Login to Your Account</h3>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ borderRadius: '8px' }}
            />
          </div>

          <button
            type="submit"
            className="btn fw-semibold w-100"
            style={{
              background: 'linear-gradient(to right, #1976d2, #0d47a1)', // Radiant blue
              color: '#fff',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          >
            🔒 Login
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/register"
            className="btn btn-outline-secondary w-100"
            style={{ borderRadius: '8px' }}
          >
            ✨ New user? Register
          </Link>
        </div>
      </div>
    </div>
  );
}
