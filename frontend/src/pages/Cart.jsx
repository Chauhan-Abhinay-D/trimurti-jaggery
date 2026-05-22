import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Trash2, CreditCard, CheckCircle, LogIn } from 'lucide-react';
import axios from 'axios';
import { load } from '@cashfreepayments/cashfree-js';
import './Cart.css';

const Cart = () => {
  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('cart') || "[]"));
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  
  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'address'
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [addressParts, setAddressParts] = useState({
    houseNo: '', building: '', street: '', area: '', city: '', pincode: '', state: 'Maharashtra'
  });
  const [contactPhone, setContactPhone] = useState(sessionUser.phone || '');

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", " Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ].sort();

  const saveCart = (newItems) => {
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = subtotal > 500 ? 0 : 50;
  const total = subtotal + delivery;

  const handleRemove = (id) => {
    saveCart(items.filter(item => item.id !== id));
  };

  const startCheckout = () => {
    // Parse existing address if available
    if (sessionUser.address) {
      const parts = sessionUser.address.split(',').map(p => p.trim());
      setAddressParts({
        houseNo: parts[0] || '',
        building: parts[1] || '',
        street: parts[2] || '',
        area: parts[3] || '',
        city: parts[4] || '',
        pincode: parts[5] || '',
        state: parts[6] || 'Maharashtra'
      });
    }
    setContactPhone(sessionUser.phone || '');
    setCheckoutStep('address');
  };

  const initCashfreeCheckout = async () => {
    setPaymentStatus('processing');
    try {
      // Initialize Cashfree
      const cashfree = await load({ mode: "sandbox" });
      
      // Simulate backend session creation
      console.log('Simulating fetching payment session from Backend...');
      
      // Since we don't have a live backend session ID, we'll simulate the popup wait time
      setTimeout(async () => {
        try {
          // CALL BACKEND TO PERSIST ORDER
          const orderPayload = {
            userId: sessionUser.id,
            totalAmount: total,
            items: items.map(i => ({ id: i.id, qty: i.qty, price: i.price }))
          };
          
          
          const res = await axios.post('http://localhost:8080/api/orders', orderPayload);
          
          setConfirmedOrder(res.data);
          setPaymentStatus('success'); 
          saveCart([]); 
        } catch (err) {
          console.error("Order persistence failed:", err);
          alert("Payment processed, but failed to save order to database.");
          setPaymentStatus(null);
        }
      }, 2000);

      // In real scenario you would do:
      /*
      cashfree.checkout({
        paymentSessionId: "session_id_from_backend",
        returnUrl: "http://localhost:5173/profile"
      });
      */
      
    } catch (error) {
      console.error(error);
      setPaymentStatus(null);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="cart-page container animate-fade-in text-center" style={{paddingTop: '10rem'}}>
        <CheckCircle size={64} color="#10b981" style={{margin: '0 auto 1.5rem'}} />
        <h2>Order Placed Successfully!</h2>
        
        <div className="mt-6 glass" style={{maxWidth: '500px', margin: '1.5rem auto', padding: '1.5rem', border: '1px solid #e2e8f0'}}>
           <p style={{fontSize: '1.1rem', fontWeight: 600}}>
             Order ID: <span style={{color: 'var(--color-primary)'}}>
               {confirmedOrder?.orderTrackingId || (confirmedOrder?.id ? `#${confirmedOrder.id}` : 'Processing...')}
             </span>
           </p>
           <p className="mt-2 text-muted" style={{fontSize: '0.9rem'}}>
             Date: {confirmedOrder?.orderDate ? new Date(confirmedOrder.orderDate).toLocaleString('en-GB', { hour12: false }) : new Date().toLocaleString('en-GB', { hour12: false })}
           </p>
        </div>

        <p className="mt-4" style={{color: '#334155'}}>Thank you for choosing Trimurti Jaggery. Your order has been registered in our system.</p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem'}}>
          <Link to="/profile" className="btn btn-secondary">My Orders</Link>
          <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page container animate-fade-in">
      <h2>Your Cart</h2>
      
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is currently empty.</p>
          <Link to="/products"><button className="btn btn-primary mt-4">Continue Shopping</button></Link>
        </div>
      ) : (
        <div className="cart-layout grid">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item glass">
                <img src={item.image} alt={item.name} className="item-img" />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">₹{item.price}</p>
                  <div className="item-actions">
                    <div className="qty-controls">
                      <button onClick={() => {
                        const newItems = [...items];
                        const idx = newItems.findIndex(i => i.id === item.id);
                        if(newItems[idx].qty > 1) newItems[idx].qty--;
                        saveCart(newItems);
                      }}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => {
                        const newItems = [...items];
                        const idx = newItems.findIndex(i => i.id === item.id);
                        if (newItems[idx].qty < (item.stockQuantity || 99)) {
                          newItems[idx].qty++;
                          saveCart(newItems);
                        } else {
                          alert(`Maximum available stock reached for ${item.name}.`);
                        }
                      }}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="item-total">
                  ₹{item.price * item.qty}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary glass">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            
            {localStorage.getItem('token') ? (
              checkoutStep === 'cart' ? (
                <button 
                  className="btn btn-primary w-full checkout-btn" 
                  onClick={startCheckout}
                >
                  <CreditCard size={20} /> Proceed to Checkout
                </button>
              ) : (
                <div className="address-confirmation mt-6">
                  <h3 style={{fontSize: '1.1rem', marginBottom: '1rem'}}>Confirm Delivery Details</h3>
                  
                  <div className="address-form" style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                      <input type="text" className="input-field" placeholder="House No" value={addressParts.houseNo} onChange={e=>setAddressParts({...addressParts, houseNo: e.target.value})} />
                      <input type="text" className="input-field" placeholder="Building" value={addressParts.building} onChange={e=>setAddressParts({...addressParts, building: e.target.value})} />
                    </div>
                    <input type="text" className="input-field" placeholder="Street / Landmark" value={addressParts.street} onChange={e=>setAddressParts({...addressParts, street: e.target.value})} />
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                      <input type="text" className="input-field" placeholder="Area" value={addressParts.area} onChange={e=>setAddressParts({...addressParts, area: e.target.value})} />
                      <input type="text" className="input-field" placeholder="City" value={addressParts.city} onChange={e=>setAddressParts({...addressParts, city: e.target.value})} />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                      <input type="text" className="input-field" placeholder="Pincode" maxLength="6" value={addressParts.pincode} onChange={e=>setAddressParts({...addressParts, pincode: e.target.value.replace(/\D/g, '')})} />
                      <select className="input-field" value={addressParts.state} onChange={e=>setAddressParts({...addressParts, state: e.target.value})}>
                        {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label style={{fontSize: '0.8rem', fontWeight: 600}}>Contact Phone</label>
                      <input type="tel" className="input-field" maxLength="10" placeholder="10-digit number" value={contactPhone} onChange={e=>setContactPhone(e.target.value.replace(/\D/g, ''))} />
                    </div>

                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                       <button 
                         className="btn btn-primary flex-1" 
                         onClick={async () => {
                           // Validation
                           if (!addressParts.houseNo || !addressParts.street || !addressParts.city || !addressParts.pincode || addressParts.pincode.length !== 6 || contactPhone.length !== 10) {
                             alert("Please provide complete address and a valid 10-digit phone number.");
                             return;
                           }
                           
                           setIsSavingAddress(true);
                           const fullAddress = `${addressParts.houseNo}, ${addressParts.building}, ${addressParts.street}, ${addressParts.area}, ${addressParts.city}, ${addressParts.pincode}, ${addressParts.state}`;
                           
                           try {
                             // Persist to user profile
                             await axios.put(`http://localhost:8080/api/admin/users/${sessionUser.id}`, {
                               name: sessionUser.name,
                               phone: contactPhone,
                               address: fullAddress
                             });
                             
                             // Update local storage
                             const updatedUser = { ...sessionUser, phone: contactPhone, address: fullAddress };
                             localStorage.setItem('user', JSON.stringify(updatedUser));
                             window.dispatchEvent(new Event('userUpdated'));
                             
                             // Proceed to payment
                             initCashfreeCheckout();
                           } catch (err) {
                             alert("Failed to save delivery details. Please try again.");
                           } finally {
                             setIsSavingAddress(false);
                           }
                         }}
                         disabled={isSavingAddress || paymentStatus === 'processing'}
                       >
                         {isSavingAddress ? 'Saving...' : 'Confirm & Pay'}
                       </button>
                       <button className="btn btn-secondary" onClick={() => setCheckoutStep('cart')} disabled={isSavingAddress || paymentStatus === 'processing'}>
                         Back
                       </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <Link to="/login" className="btn btn-secondary w-full" style={{display: 'flex', gap: '0.5rem'}}>
                <LogIn size={20} /> Login to Checkout
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
