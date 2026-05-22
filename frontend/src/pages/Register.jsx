import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return false;
    }
    // Password security: minimum 8 characters, at least one letter and one number
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(formData.password)) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const response = await axios.post('http://localhost:8080/api/auth/register', { 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone,
            password: formData.password 
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ ...response.data, email: formData.email }));
        
        // Notify other components (like Navbar) that the user session changed
        window.dispatchEvent(new Event('userUpdated'));
        
        navigate('/profile');
      } catch (err) {
        setError(err.response?.data || "Registration failed. Try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container glass">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join the Trimurti Jaggery family</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form" autoComplete="off">
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field pl-10" 
                placeholder="John Doe" 
                required
                autoComplete="off" 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field pl-10" 
                placeholder="you@example.com" 
                required
                autoComplete="off" 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={20} />
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                className="input-field pl-10" 
                placeholder="10-digit mobile number" 
                maxLength="10"
                required
                autoComplete="off" 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field pl-10" 
                placeholder="••••••••" 
                required
                autoComplete="new-password" 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock className="input-icon" size={20} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="input-field pl-10" 
                style={{ paddingRight: '2.5rem' }}
                placeholder="••••••••" 
                required
                autoComplete="new-password" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn btn-google w-full">
          <img src="https://img.icons8.com/color/24/000000/google-logo.png" alt="Google" />
          Sign up with Google
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
