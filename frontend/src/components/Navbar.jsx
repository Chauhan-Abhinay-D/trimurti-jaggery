import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  const [sessionUser, setSessionUser] = useState(JSON.parse(localStorage.getItem('user') || "{}"));
  

  useEffect(() => {
    const handleStorageChange = () => {
      setSessionUser(JSON.parse(localStorage.getItem('user') || "{}"));
    };
    window.addEventListener('storage', handleStorageChange);
    // Also listen for local updates in the same tab
    window.addEventListener('userUpdated', handleStorageChange);
    const updateCount = () => {
       const cart = JSON.parse(localStorage.getItem('cart') || "[]");
       setCartCount(cart.reduce((sum, item) => sum + item.qty, 0));
    };
    updateCount();
    window.addEventListener('cartUpdated', updateCount);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('cartUpdated', updateCount);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`navbar ${isScrolled ? 'scrolled glass' : ''}`}>
      <div className="container nav-content">
        <Link to="/" className="brand">
          <img src="https://i.postimg.cc/DyX916RK/trimurti-logo.jpg" alt="Trimurti Jaggery" className="logo" />
          <span className="brand-name">Trimurti Jaggery</span>
        </Link>

        <nav className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/profile" className="icon-btn" aria-label="User Profile">
            <User size={24} />
          </Link>
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Shopping Cart">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button className="mobile-toggle icon-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
