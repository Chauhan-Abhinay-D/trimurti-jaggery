import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { User, MapPin, Package, Settings, LogOut } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Profile.css';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
].sort();

const Profile = () => {
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // If not authenticated, redirect to Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  
  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const [profileData, setProfileData] = useState({
    name: sessionUser.name || 'John Doe',
    email: sessionUser.email || 'user@example.com',
    phone: sessionUser.phone || '',
    address: sessionUser.address || ''
  });

  const [addressParts, setAddressParts] = useState({
    houseNo: '',
    building: '',
    street: '',
    area: '',
    city: '',
    pincode: '',
    state: 'Maharashtra'
  });

  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse existing address into parts when component mounts or data changes
  useEffect(() => {
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
  }, [sessionUser.address]);

  useEffect(() => {
    // Sync local state if storage changes elsewhere
    const syncProfile = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || "{}");
      setProfileData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        address: updatedUser.address || ''
      });
      if (updatedUser.address) {
        const parts = updatedUser.address.split(',').map(p => p.trim());
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
    };
    window.addEventListener('storage', syncProfile);
    window.addEventListener('userUpdated', syncProfile);
    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('userUpdated', syncProfile);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      axios.get(`http://localhost:8080/api/orders/user/${sessionUser.id}`)
        .then(res => {
          setUserOrders(res.data);
          setLoadingOrders(false);
        })
        .catch(err => {
          console.error("Error fetching user orders", err);
          setLoadingOrders(false);
        });
    }
  }, [activeTab, sessionUser.id]);

  const handleSave = async () => {
    // Validate phone number: must be exactly 10 digits
    if (profileData.phone && !/^\d{10}$/.test(profileData.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setIsSaving(true);
    const fullAddress = `${addressParts.houseNo}, ${addressParts.building}, ${addressParts.street}, ${addressParts.area}, ${addressParts.city}, ${addressParts.pincode}, ${addressParts.state}`;
    
    try {
      const response = await axios.put(`http://localhost:8080/api/admin/users/${sessionUser.id}`, {
        name: profileData.name,
        phone: profileData.phone,
        address: fullAddress
      });
      
      // Update local storage so other components (Navbar) update immediately
      const updatedUser = { ...sessionUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userUpdated'));
      
      // Refresh component local state
      setIsEditing(false);
      alert('Profile Details Updated Successfully!');
    } catch (err) {
      console.error("Profile update failed:", err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'PAID': return 1;
      case 'SHIPPED': return 2;
      case 'DELIVERED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const steps = [
    { label: 'Order Placed', desc: 'We have received your order' },
    { label: 'Processing', desc: 'Your jaggery is being packed' },
    { label: 'Shipped', desc: 'On its way to your home' },
    { label: 'Delivered', desc: 'Enjoy your pure sweetness!' }
  ];
  const handleDownloadInvoice = (order) => {
    const doc = new jsPDF();
    const orderId = order.orderTrackingId || order.id;

    // Header - Company Branding
    doc.setFontSize(22);
    doc.setTextColor(133, 77, 14); // #854d0e
    doc.text('TRIMURTI JAGGERY', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text('Trimurti Agro Products', 14, 28);
    doc.text('Yenki, Udgir, Latur - 413517', 14, 33);
    doc.text('Phone: +91 9021321991', 14, 38);

    // Invoice Label & Order Info
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 140, 20);
    
    doc.setFontSize(10);
    doc.text(`Order ID: ${orderId}`, 140, 28);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 140, 33);

    // Separator Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 196, 45);

    // Bill To Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const customerBlock = [
      sessionUser.name,
      sessionUser.phone || 'N/A',
      sessionUser.address || 'N/A'
    ];
    doc.text(customerBlock, 14, 62);

    // Items Table
    const tableData = order.items.map(item => [
      item.product.name,
      item.quantity.toString(),
      `INR ${item.priceAtPurchase}`,
      `INR ${item.priceAtPurchase * item.quantity}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Product Name', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [133, 77, 14], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 14, right: 14 }
    });

    // Summary - Total Amount
    const finalY = (doc).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: INR ${order.totalAmount}`, 140, finalY, { align: 'left' });

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for choosing Trimurti Jaggery! Pure agricultural goodness.', 105, finalY + 30, { align: 'center' });
    doc.text('This is a computer-generated invoice and requires no signature.', 105, finalY + 35, { align: 'center' });

    // Trigger Direct Download
    doc.save(`Invoice_${orderId}.pdf`);
  };

  return (
    <div className="profile-page container animate-fade-in">
      <div className="profile-layout grid">
        <aside className="profile-sidebar glass">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <User size={48} color="var(--color-primary)" />
            </div>
            <h3>{profileData.name}</h3>
            <p>{profileData.email}</p>
          </div>
          
          <nav className="profile-nav">
            <button className={`nav-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              <Settings size={20} /> Account Details
            </button>
            <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <Package size={20} /> My Orders
            </button>
            <button className="nav-btn text-red" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}>
              <LogOut size={20} /> Sign Out
            </button>
          </nav>
        </aside>

        <main className="profile-content glass">
          {activeTab === 'details' && (
            <div className="details-section">
              <div className="section-header-row">
                <h2>Profile Information</h2>
                {!isEditing && (
                  <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Details</button>
                )}
              </div>
              
              <div className="profile-form mt-4">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" className="input-field" value={profileData.name} disabled={!isEditing} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input type="email" className="input-field" value={profileData.email} disabled={true} /> 
                  <span className="help-text">Email cannot be changed directly.</span>
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profileData.phone} 
                    disabled={!isEditing} 
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Numeric only
                      setProfileData({...profileData, phone: val});
                    }} 
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Delivery Address</label>
                  {!isEditing ? (
                    <textarea className="input-field" rows="3" value={profileData.address} disabled={true}></textarea>
                  ) : (
                    <div className="address-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>House / Flat No.</label>
                         <input type="text" className="input-field" value={addressParts.houseNo} onChange={e=>setAddressParts({...addressParts, houseNo: e.target.value})} placeholder="e.g. 101" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>Building / Society</label>
                         <input type="text" className="input-field" value={addressParts.building} onChange={e=>setAddressParts({...addressParts, building: e.target.value})} placeholder="e.g. Sunrise Appt" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 2'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>Street / Landmark</label>
                         <input type="text" className="input-field" value={addressParts.street} onChange={e=>setAddressParts({...addressParts, street: e.target.value})} placeholder="e.g. Near Main Market" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>Area / Locality</label>
                         <input type="text" className="input-field" value={addressParts.area} onChange={e=>setAddressParts({...addressParts, area: e.target.value})} placeholder="e.g. Udgir Road" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>City</label>
                         <input type="text" className="input-field" value={addressParts.city} onChange={e=>setAddressParts({...addressParts, city: e.target.value})} placeholder="e.g. Latur" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>Pincode</label>
                         <input type="text" className="input-field" maxLength="6" value={addressParts.pincode} onChange={e=>setAddressParts({...addressParts, pincode: e.target.value.replace(/\D/g, '')})} placeholder="413517" />
                       </div>
                       <div className="input-group" style={{gridColumn: 'span 1'}}>
                         <label className="input-label" style={{fontSize: '0.75rem'}}>State</label>
                         <select 
                           className="input-field" 
                           value={addressParts.state} 
                           onChange={e=>setAddressParts({...addressParts, state: e.target.value})}
                           style={{padding: '0.6rem'}}
                         >
                           {indianStates.map(state => (
                             <option key={state} value={state}>{state}</option>
                           ))}
                         </select>
                       </div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="form-actions mt-6" style={{display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem'}}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-section">
              <h2>My Order ID & Tracking</h2>
              {loadingOrders ? (
                <p>Loading your orders...</p>
              ) : (Array.isArray(userOrders) && userOrders.length > 0) ? (
                <div className="orders-list mt-4">
                  {userOrders.map(order => (
                    <div key={order?.id || Math.random()} className="order-history-card glass" style={{padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <div>
                          <strong>Order ID {order?.orderTrackingId || `#${order?.id}`}</strong>
                          <div style={{fontSize: '0.85rem', color: '#334155'}}>{order?.orderDate ? new Date(order.orderDate).toLocaleString('en-GB', { hour12: false }) : 'N/A'}</div>
                        </div>
                        <span className="badge">{order?.status || 'PENDING'}</span>
                      </div>
                      <div className="order-items-minimal" style={{marginBottom: '1rem'}}>
                        {Array.isArray(order?.items) && order.items.map((item, idx) => (
                          <div key={idx} style={{fontSize: '0.90rem', color: '#475569', display: 'flex', justifyContent: 'space-between'}}>
                             <span>{item?.product?.name || 'Product'} x {item?.quantity || 1}</span>
                             <span>₹{(item?.priceAtPurchase || 0) * (item?.quantity || 1)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem'}}>
                        <div style={{fontWeight: 700}}>Total: ₹{order?.totalAmount || 0}</div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadInvoice(order)}>
                            Download Bill
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedOrder(order); setIsTrackingModalOpen(true); }}>
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Package size={48} color="#cbd5e1" />
                  <p>You haven't placed any orders yet.</p>
                  <button className="btn btn-primary mt-4" onClick={() => window.location.href='/products'}>Browse Products</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* TRACKING MODAL */}
      {isTrackingModalOpen && selectedOrder && (
        <div className="tracking-modal-overlay">
          <div className="tracking-modal-content glass animate-fade-in">
            <div className="modal-header">
              <h3>Track Order: {selectedOrder.orderTrackingId || `#${selectedOrder.id}`}</h3>
              <button onClick={() => setIsTrackingModalOpen(false)} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="order-summary-box">
                <p><strong>Placed on:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()} at {new Date(selectedOrder.orderDate).toLocaleTimeString('en-GB', {hour12: false})}</p>
                <p><strong>Status:</strong> <span className={`status-text ${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span></p>
                <button className="btn btn-primary btn-sm mt-2" onClick={() => handleDownloadInvoice(selectedOrder)}>
                  Download Official Bill
                </button>
              </div>

              {selectedOrder.status === 'CANCELLED' ? (
                <div className="cancelled-notice">
                  <p>This order has been cancelled.</p>
                </div>
              ) : (
                <div className="tracking-stepper">
                  {steps.map((step, index) => {
                    const currentStep = getStatusStep(selectedOrder.status);
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    
                    return (
                      <div key={index} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                        <div className="step-marker">
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="step-info">
                          <h4>{step.label}</h4>
                          <p>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="order-details-mini mt-6">
                <h4>Items Ordered</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="mini-item">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>₹{item.priceAtPurchase * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
