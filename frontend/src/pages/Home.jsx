import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import './Home.css';

const Home = () => {
  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from our Spring Boot Backend
    axios.get('http://localhost:8080/api/products')
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching products, using dummy fallback:", error);
        // Fallback to dummy data if backend is offline
        setProducts([
          { id: 1, name: 'Premium Jaggery Block', price: 250, weight: '1 kg', image: '/assets/jaggery_block.png', desc: '100% Natural, chemical-free raw jaggery block retaining all essential minerals.' },
          { id: 2, name: 'Pure Jaggery Powder', price: 280, weight: '1 kg', image: '/assets/jaggery_powder.png', desc: 'Finely crushed jaggery powder, perfect for quick dissolution in tea, coffee, and sweets.' },
          { id: 3, name: 'Liquid Jaggery (Kakvi)', price: 220, weight: '500 ml', image: '/assets/liquid_jaggery.png', desc: 'Rich, distinct flavor in liquid form.' }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page animate-fade-in">
      <section className="hero" style={{ backgroundImage: 'url(/assets/hero_bg.png)' }}>
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <span className="hero-badge">100% Pure & Natural</span>
          <h1 className="hero-title">Experience the Golden Goodness of Nature</h1>
          <p className="hero-subtitle">
            Authentic, chemical-free jaggery crafted with care to preserve vital nutrients and bring health to your everyday meals.
          </p>
          <div className="hero-actions">
            <Link to="/products"><button className="btn btn-primary btn-lg">Shop Now</button></Link>
            <button className="btn btn-secondary btn-lg glass" style={{ borderColor: 'transparent', color: '#fff' }}>Explore Process</button>
          </div>
        </div>
      </section>

      <section className="products-section container">
        <div className="section-header">
          <h2>Our Bestsellers</h2>
          <p>Discover the purest form of sweetness directly from our factory.</p>
        </div>

        <div className="products-grid">
          {Array.isArray(products) && products.slice(0, 3).map(product => (
            <div key={product?.id || Math.random()} className="product-card glass hover:shadow-lg transition-transform">
              <div className="product-img-wrapper">
                <img src={product.imageUrl || product.image} alt={product.name} className="product-img" />
                <div className="product-actions-overlay">
                  {product.stockQuantity > 0 ? (
                    <button className="btn btn-primary add-to-cart-btn" onClick={() => {
                        let cart = JSON.parse(localStorage.getItem('cart') || "[]");
                        let existing = cart.find(i => i.id === product.id);
                        const currentQty = existing ? existing.qty : 0;
                        
                        if (currentQty + 1 > (product.stockQuantity || 0)) {
                            alert(`Only ${product.stockQuantity || 0} units of ${product.name} are available in stock.`);
                            return;
                        }

                        if (existing) {
                            existing.qty += 1;
                        } else {
                            cart.push({...product, qty: 1, image: product.imageUrl || product.image});
                        }
                        localStorage.setItem('cart', JSON.stringify(cart));
                        window.dispatchEvent(new Event('cartUpdated'));
                        alert(`${product.name} added to cart!`);
                    }}>
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                  ) : (
                    <button className="btn btn-secondary add-to-cart-btn" disabled style={{cursor: 'not-allowed', background: '#94a3b8', color: '#f1f5f9', borderColor: '#94a3b8'}}>
                      Out of Stock
                    </button>
                  )}
                </div>
                {product.stockQuantity === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <span className="product-weight">{product.weight}</span>
                <p className="product-desc">{product.description || product.desc}</p>
                <div className="product-footer">
                  <span className="product-price">₹{product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12" style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/products" className="btn btn-secondary">
            View Full Catalog
          </Link>
        </div>
      </section>

      <section className="features-section">
        <div className="container features-grid">
          <div className="feature">
            <div className="feature-icon">🌿</div>
            <h3>100% Organic</h3>
            <p>Sourced from certified organic sugarcane farms.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🚫</div>
            <h3>No Chemicals</h3>
            <p>Processed completely without synthetic chemicals or preservatives.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🏭</div>
            <h3>Direct to Consumer</h3>
            <p>From our farm to your table, ensuring the freshest quality.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
