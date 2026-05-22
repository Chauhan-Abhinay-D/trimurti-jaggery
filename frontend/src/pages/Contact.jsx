import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import axios from 'axios';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      alert("Please enter a valid 10-digit phone number.");
      setIsSubmitting(false);
      return;
    }
    try {
      await axios.post('/api/inquiries', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phoneNumber: '', message: '' });
    } catch (err) {
      alert("System sync error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page animate-fade-in container">
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>We'd love to hear from you. Reach out to us for bulk orders, inquiries, or feedback.</p>
      </div>

      <div className="contact-top-row">
        <div className="info-card glass">
          <div className="icon-wrapper"><MapPin size={28} /></div>
          <h3>Our Factory</h3>
          <p>Trimurti Agro Products<br/>Yenki, Udgir<br/>Latur, Maharashtra - 413517</p>
        </div>
        
        <div className="info-card glass">
          <div className="icon-wrapper"><Mail size={28} /></div>
          <h3>Email Us</h3>
          <p>
            <a href="mailto:trimurtiagroproducts.official@gmail.com">
              trimurtiagroproducts.official@gmail.com
            </a>
          </p>
        </div>

        <div className="info-card glass">
          <div className="icon-wrapper"><Phone size={28} /></div>
          <h3>Call Us</h3>
          <p><a href="tel:+919021321991" style={{textDecoration: 'none', color: 'inherit'}}>+91 9021321991</a></p>
        </div>
      </div>

      <div className="contact-bottom-row">
        <div className="map-container-wrapper glass">
          <iframe 
            src="https://maps.google.com/maps?q=18.323046624270955,77.10124784973081&t=k&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%" 
            height="100%" 
            style={{border:0, borderRadius: '0.5rem', minHeight: '400px'}} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Satellite Map of Trimurti Agro Products"
          ></iframe>
        </div>
        
        <div className="form-wrapper glass">
          <h2>Send a Message</h2>
          {success ? (
            <div className="success-msg animate-fade-in" style={{background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem'}}>
               Thank you for reaching out! Our team will contact you shortly.
            </div>
          ) : null}
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" className="input-field" placeholder="John Doe" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" className="input-field" placeholder="john@example.com" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="10-digit contact number" 
                required 
                maxLength={10}
                value={formData.phoneNumber} 
                onChange={e=>{
                  const val = e.target.value.replace(/\D/g,'');
                  setFormData({...formData, phoneNumber: val});
                }} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea className="input-field" rows="5" placeholder="How can we help you?" required value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '0.5rem'}} disabled={isSubmitting}>
               {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
