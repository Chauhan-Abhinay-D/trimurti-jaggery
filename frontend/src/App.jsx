import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products'; // IMPORT PRODUCTS CATALOGUE
import Contact from './pages/Contact';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard'; // IMPORT
import Policies from './pages/Policies';

// Utility component to scroll to top and update document title on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const routeTitles = {
      '/': 'Trimurti Jaggery',
      '/about': 'About Us | Trimurti Jaggery',
      '/products': 'Products | Trimurti Jaggery',
      '/contact': 'Contact | Trimurti Jaggery',
      '/login': 'Login | Trimurti Jaggery',
      '/register': 'Register | Trimurti Jaggery',
      '/profile': 'Profile | Trimurti Jaggery',
      '/cart': 'Cart | Trimurti Jaggery',
      '/admin': 'Admin Dashboard | Trimurti Jaggery',
      '/policies': 'Policies | Trimurti Jaggery',
    };

    document.title = routeTitles[pathname] || 'Trimurti Jaggery';
  }, [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/policies" element={<Policies />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
