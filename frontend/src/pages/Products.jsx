import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import './Products.css';

const Products = () => {
  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch products from backend
    const token = localStorage.getItem('token');
    axios.get('/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching products, using dummy fallback:", error);
        setProducts([
          { id: 1, name: 'Premium Jaggery Block', price: 250, weight: '1 kg', image: '/assets/jaggery_block.png', desc: '100% Natural' },
          { id: 2, name: 'Pure Jaggery Powder', price: 280, weight: '1 kg', image: '/assets/jaggery_powder.png', desc: 'Finely crushed' },
          { id: 3, name: 'Liquid Jaggery (Kakvi)', price: 220, weight: '500 ml', image: '/assets/liquid_jaggery.png', desc: 'Rich distinct flavor' }
        ]);
        setLoading(false);
      });
  }, []);

  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  // Compute segregated weight metrics dynamically with safety guards
  const safeProducts = Array.isArray(products) ? products : [];
  const uniqueWeights = [...new Set(safeProducts.map(p => p?.weight).filter(Boolean))];
  const liquidWeights = uniqueWeights.filter(w => {
    const term = (w || '').toLowerCase();
    return term.includes('ml') || term.includes('lit') || term.includes('ltr') || term.endsWith('l');
  });
  const solidWeights = uniqueWeights.filter(w => !liquidWeights.includes(w));

  // Filtering Logic with safety checks
  const filteredProducts = safeProducts.filter(product => {
    if (!product) return false;
    const matchesSearch = (product.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesWeight = selectedWeight === 'All' || product.weight === selectedWeight;
    return matchesSearch && matchesWeight;
  });

  return (
    <div className="products-page animate-fade-in container">
      <div className="page-title-banner">
        <h1>All Products</h1>
        <p>Explore our wide range of 100% organic, natural Jaggery products.</p>
      </div>

      <div className="catalog-layout" style={{ gridTemplateColumns: showFilters ? '250px 1fr' : '1fr' }}>
        {showFilters && (
          <aside className="catalog-sidebar glass">
            <div className="sidebar-section">
              <h3><Filter size={18} /> Filters</h3>
              <div className="filter-group">
                <h4>Solid Measures (KG/G)</h4>
                <ul className="filter-list">
                  <li>
                    <label className="filter-label">
                      <input 
                        type="radio" 
                        name="weight-filter" 
                        checked={selectedWeight === 'All'}
                        onChange={() => setSelectedWeight('All')}
                      />
                      <span>All Products</span>
                    </label>
                  </li>
                  {solidWeights.map((weight, idx) => (
                    <li key={`solid-${idx}`}>
                      <label className="filter-label">
                        <input 
                          type="radio" 
                          name="weight-filter" 
                          checked={selectedWeight === weight}
                          onChange={() => setSelectedWeight(weight)}
                        />
                        <span>{weight}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {liquidWeights.length > 0 && (
                <div className="filter-group" style={{marginTop: '1.5rem'}}>
                  <h4>Liquid Extracts (ML/L)</h4>
                  <ul className="filter-list">
                    {liquidWeights.map((weight, idx) => (
                      <li key={`liquid-${idx}`}>
                        <label className="filter-label">
                          <input 
                            type="radio" 
                            name="weight-filter" 
                            checked={selectedWeight === weight}
                            onChange={() => setSelectedWeight(weight)}
                          />
                          <span>{weight}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}

        <div className="catalog-main">
          <div className="catalog-topbar glass">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowFilters(!showFilters)}
              style={{marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
            >
              <Filter size={18} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="products-grid">
            {loading ? (
              <p>Loading premium products...</p>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card glass">
                  <div className="product-img-wrapper">
                    <img src={product.imageUrl || product.image || '/assets/jaggery_block.png'} alt={product.name} className="product-img" />
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

                            if(existing) {
                                existing.qty += 1;
                            } else {
                                cart.push({...product, qty: 1, image: product.imageUrl || product.image || '/assets/jaggery_block.png'});
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
              ))
            ) : (
              <p className="no-products-msg">No products matched your exact search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
