import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  if (sessionUser.role === 'ROLE_ADMIN' || sessionUser.role === 'ROLE_SUPER_ADMIN') {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-content grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
             <img src="https://i.postimg.cc/DyX916RK/trimurti-logo.jpg" alt="Trimurti Jaggery" className="logo" />
             <span className="brand-name" style={{color: 'white'}}>Trimurti Jaggery</span>
          </Link>
          <p className="mt-4 text-gray-400">Pure, organic agricultural goodness sourced directly from nature. Crafting authentic sweetness since 1980.</p>
        </div>
        
        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/policies">Legal Policies</Link></li>
          </ul>
        </div>
        
        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p>Trimurti Agro Products</p>
          <p>Latur, Maharashtra</p>
          <p><a href="mailto:trimurtiagroproducts.official@gmail.com" style={{color: 'inherit', textDecoration: 'none'}}>support@trimurtijaggery.com</a></p>
          <p><a href="tel:+919021321991" style={{color: 'inherit', textDecoration: 'none'}}>+91 9021321991</a></p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center'}}>
          <p>&copy; {currentYear} Trimurti Agro Products. All Rights Reserved.</p>
          <p className="developer-tag">
             Developed by <strong>RamaForgeStudio, Latur</strong>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
