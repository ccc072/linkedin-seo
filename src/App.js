import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    headline: '',
    about: '',
    skills: '',
    certifications: '',
    targetRole: '',
    connections: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/api/submit`, formData);
      setSuggestions(response.data.suggestions);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.details || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="App">
      <div className="split-container">
        {/* Left Side - Hero */}
        <div className="hero-section">
          <div className="hero-overlay">
            <div className="hero-content">
              <h1 className="hero-title">
                Transform Your LinkedIn Profile
              </h1>
              <p className="hero-subtitle">
                AI-powered profile optimization + personalized growth strategy delivered straight to your inbox
              </p>
              
              <div className="trust-badges">
                <div className="badge">
                  <span className="badge-number">10K+</span>
                  <span className="badge-text">Profiles Optimized</span>
                </div>
                <div className="badge">
                  <span className="badge-number">48h</span>
                  <span className="badge-text">Delivery Time</span>
                </div>
                <div className="badge">
                  <span className="badge-number">AI</span>
                  <span className="badge-text">Powered Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form or Success */}
        <div className="form-section">
          {!submitted ? (
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">Get Your Growth Plan</h2>
                <p className="form-description">Fill in your current LinkedIn details and receive AI-powered optimization suggestions via email</p>
              </div>
              
              {error && (
                <div className="error-message" data-testid="error-message">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="growth-form">
                <div className="form-field">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="John Doe"
                    data-testid="input-name"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="john@example.com"
                    data-testid="input-email"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="headline" className="form-label">Current LinkedIn Headline</label>
                  <input
                    type="text"
                    id="headline"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Software Engineer at Tech Company"
                    data-testid="input-headline"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="about" className="form-label">About Section</label>
                  <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    required
                    className="form-textarea"
                    placeholder="Tell us about yourself..."
                    rows="4"
                    data-testid="input-about"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="skills" className="form-label">Current Skills (comma separated)</label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="JavaScript, React, Node.js"
                    data-testid="input-skills"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="certifications" className="form-label">Current Certifications</label>
                  <input
                    type="text"
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="AWS Certified Developer"
                    data-testid="input-certifications"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="targetRole" className="form-label">Target Job Role</label>
                  <input
                    type="text"
                    id="targetRole"
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Senior Full Stack Developer"
                    data-testid="input-target-role"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="connections" className="form-label">Current LinkedIn Connections</label>
                  <input
                    type="number"
                    id="connections"
                    name="connections"
                    value={formData.connections}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="500"
                    data-testid="input-connections"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Analyzing Profile...' : 'Get My Growth Plan'}
                </button>
              </form>
            </div>
          ) : (
            <div className="success-container" data-testid="success-message">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Your Growth Plan is Ready!</h2>
              <p className="success-description">
                We've sent a comprehensive LinkedIn growth plan to <strong>{formData.email}</strong>
              </p>
              
              {suggestions && (
                <div className="preview-section">
                  <h3 className="preview-title">Quick Preview:</h3>
                  
                  <div className="preview-box">
                    <h4 className="preview-heading">Optimized Headlines</h4>
                    <ul className="preview-list">
                      {suggestions.headlines.map((headline, idx) => (
                        <li key={idx}>{headline}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="preview-box">
                    <h4 className="preview-heading">Ready-to-Post Content</h4>
                    <p className="preview-text">{suggestions.fullPost.substring(0, 200)}...</p>
                  </div>
                </div>
              )}
              
              <div className="next-steps">
                <h4 className="next-steps-title">What Happens Next?</h4>
                <ul className="next-steps-list">
                  <li>✉️ Check your email for the complete growth plan</li>
                  <li>📝 Implement the suggested changes to your profile</li>
                  <li>📅 We'll follow up in 48 hours to check your progress</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
