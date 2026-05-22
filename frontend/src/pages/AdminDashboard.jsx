import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, TrendingUp, Users, Settings, Grid, LogOut, Plus, Edit, Trash2, Image as ImageIcon, MessageSquare, ExternalLink, X, AlertCircle, IndianRupee, Clock, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [sessionUser, setSessionUser] = useState(() => JSON.parse(localStorage.getItem('user') || "null"));
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Redirection Guard: If no valid session after checking, send to login
    if (!sessionUser || (sessionUser?.role !== 'ROLE_ADMIN' && sessionUser?.role !== 'ROLE_SUPER_ADMIN')) {
      window.location.href = '/login';
    }
  }, [sessionUser]);

  // Removed early return from here to prevent Hook violation
  const [metrics, setMetrics] = useState({ totalOrders: 0, activeCoupons: 0, revenue: 0, userCount: 0 });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // Notification states
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);

  // CRM Drill-down state
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', weight: '', stockQuantity: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);

  // Staff & CRM State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrmSaving, setIsCrmSaving] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(null);
  const [userEditForm, setUserEditForm] = useState({ name: '', phone: '', address: '', role: '' });

  // Password Reset State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Temporary Password State (Only shown immediately after reset)
  const [temporaryPasswords, setTemporaryPasswords] = useState({});

  // Fetch dashboard core data mapped natively
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    setIsLoading(true);
    try {
      // Parallel fetching for better performance and isolation
      const [metRes, ordRes, usrRes, prdRes, inqRes] = await Promise.allSettled([
        axios.get('http://localhost:8080/api/admin/metrics', config),
        axios.get('http://localhost:8080/api/orders/admin', config),
        axios.get('http://localhost:8080/api/admin/users', config),
        axios.get('http://localhost:8080/api/products', config),
        axios.get('http://localhost:8080/api/inquiries/admin', config)
      ]);

      if (metRes.status === 'fulfilled') {
        const data = metRes.value.data;
        setMetrics(data);
        
        const storedOrders = localStorage.getItem('lastOrderCount');
        const storedUsers = localStorage.getItem('lastUserCount');
        
        const lastSeenOrders = storedOrders ? parseInt(storedOrders) : data.totalOrders;
        const lastSeenUsers = storedUsers ? parseInt(storedUsers) : data.userCount;
        
        if (!storedOrders) localStorage.setItem('lastOrderCount', (data.totalOrders || 0).toString());
        if (!storedUsers) localStorage.setItem('lastUserCount', (data.userCount || 0).toString());
        
        if ((data.totalOrders || 0) > lastSeenOrders) {
          setNewOrdersCount(data.totalOrders - lastSeenOrders);
        }
        if ((data.userCount || 0) > lastSeenUsers) {
          setNewUsersCount(data.userCount - lastSeenUsers);
        }
      }

      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data);
      if (usrRes.status === 'fulfilled') setUsers(usrRes.value.data);
      if (prdRes.status === 'fulfilled') setProducts(prdRes.value.data);
      if (inqRes.status === 'fulfilled') {
        setInquiries(inqRes.value.data);
        const newInq = inqRes.value.data.filter(i => i.status === 'NEW').length;
        setNewInquiriesCount(newInq);
      }

      if (sessionUser?.role === 'ROLE_SUPER_ADMIN') {
        try {
          const staffRes = await axios.get('http://localhost:8080/api/admin/staff', config);
          setStaff(staffRes.data);
        } catch (e) {
          console.error("Staff fetch failed:", e);
        }
      }

    } catch (err) {
      console.error("Dashboard background sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    fetchData(); // Immediate fetch on tab change or mount
  }, [activeTab, fetchData]);

  // Automated Background Polling (Every 30 Seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30s interval

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      localStorage.setItem('lastOrderCount', metrics.totalOrders.toString());
      setNewOrdersCount(0);
    }
    if (tab === 'users') {
      localStorage.setItem('lastUserCount', metrics.userCount.toString());
      setNewUsersCount(0);
    }
    if (tab === 'inquiries') {
      setNewInquiriesCount(0);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://localhost:8080/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Status sync failed.");
    }
  };

  const updateInquiryStatus = async (inquiryId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://localhost:8080/api/inquiries/${inquiryId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInquiries(inquiries.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
    } catch (err) {
      alert("Inquiry status update failed.");
    }
  };

  const handleOrderDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Are you sure you want to permanently delete this order record? This cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:8080/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(orders.filter(o => o.id !== id));
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete order.");
      }
    }
  };

  const viewUserHistory = async (user) => {
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    setSelectedUserOrders({ user, orders: [] });
    const token = localStorage.getItem('token');

    try {
      const res = await axios.get(`http://localhost:8080/api/orders/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserOrders({ user, orders: res.data || [] });
    } catch (err) {
      console.error("Error fetching CRM history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleProductDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Are you sure you want to permanently delete this product sequence?")) {
      try {
        await axios.delete(`http://localhost:8080/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(products.filter(p => p.id !== id));
      } catch (e) {
        alert("Delete failed.");
      }
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8080/api/admin/staff', staffForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Staff Member Onboarded Successfully!");
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (err) {
      alert("Staff onboarding failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (id === sessionUser.id) return alert("You cannot delete your own profile.");
    if (window.confirm("Are you sure you want to revoke administrative access for this employee?")) {
      try {
        await axios.delete(`http://localhost:8080/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStaff(staff.filter(s => s.id !== id));
        setUsers(users.filter(u => u.id !== id));
      } catch (e) {
        alert("Revoke failed.");
      }
    }
  };

  const handleUserDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Are you sure you want to permanently delete this user profile?")) {
      try {
        await axios.delete(`http://localhost:8080/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(users.filter(u => u.id !== id));
      } catch (e) {
        alert("Delete failed.");
      }
    }
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setIsCrmSaving(true);
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:8080/api/admin/users/${isEditingUser.id}`, userEditForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingUser(null);
      fetchData();
    } catch (err) {
      alert("User update failed.");
    } finally {
      setIsCrmSaving(false);
    }
  };

  const openUserEdit = (user) => {
    setIsEditingUser(user);
    setUserEditForm({ name: user.name, phone: user.phone || '', address: user.address || '', role: user.role });
  };

  const openResetPassword = (user) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsResettingPassword(true);
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:8080/api/admin/users/${selectedUserForReset.id}/reset-password`, 
        { newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Password reset successfully! Please note down the new password: ${newPassword}`);
      setTemporaryPasswords(prev => ({...prev, [selectedUserForReset.id]: newPassword}));
      setIsResetPasswordModalOpen(false);
      setNewPassword('');
      fetchData();
    } catch (err) {
      alert("Failed to reset password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const authConfig = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      let finalImageUrl = productForm.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post('http://localhost:8080/api/admin/upload', formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
        });
        finalImageUrl = uploadRes.data.imageUrl;
      }
      
      const payload = { ...productForm, imageUrl: finalImageUrl };

      if (editingProductId) {
        await axios.put(`http://localhost:8080/api/products/${editingProductId}`, payload, authConfig);
      } else {
        await axios.post('http://localhost:8080/api/products', payload, authConfig);
      }
      
      fetchData();
      setIsProductModalOpen(false);
      setProductForm({ name: '', description: '', price: '', weight: '', stockQuantity: '', imageUrl: '' });
      setImageFile(null);
      setEditingProductId(null);
    } catch (err) {
      alert("Product operational transfer failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name, description: product.description || '', price: product.price, weight: product.weight || '', stockQuantity: product.stockQuantity, imageUrl: product.imageUrl || ''
    });
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  // Guard: Final check before rendering JSX
  if (!sessionUser) return <div className="admin-page" style={{background: '#f8fafc'}}></div>;

  return (
    <div id="adminPage" className="admin-page animate-fade-in">
      <div id="adminLayout" className="admin-layout">
        {/* Sidebar Nav */}
        <aside id="adminSidebar" className="admin-sidebar">
          <div className="admin-avatar">
            <h3>{sessionUser?.name} <br/><span style={{fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)'}}>
              {sessionUser?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Employee Manager'}
            </span></h3>
          </div>
          <nav className="admin-nav profile-nav">
            <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
               <Settings size={20} /> Dashboard
            </button>
            <button className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleTabChange('products')}>
               <Grid size={20} /> Products
            </button>
            <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleTabChange('orders')}>
               <Package size={20} /> Orders
               {newOrdersCount > 0 && <span className="notification-dot"></span>}
            </button>
            <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>
               <Users size={20} /> Users
               {newUsersCount > 0 && <span className="notification-dot"></span>}
            </button>
            {sessionUser?.role === 'ROLE_SUPER_ADMIN' && (
              <button className={`nav-btn ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => handleTabChange('staff')}>
                 <Users size={20} /> Employee Management
              </button>
            )}
            <button className={`nav-btn ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => handleTabChange('inquiries')}>
               <MessageSquare size={20} /> Inquiries
               {newInquiriesCount > 0 && <span className="notification-dot"></span>}
            </button>
            <button className="nav-btn text-red" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('userUpdated'));
              window.location.href = '/login';
            }}>
               <LogOut size={20} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Dynamic Content */}
        <main id="adminContent" className="admin-content">
          {isLoading && activeTab !== 'dashboard' ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="ml-4 text-gray-600">Loading data...</p>
            </div>
          ) : (
            <>
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab animate-fade-in">
              <h2>Analytics Overview</h2>
              <div className="metrics-grid">
                <div className="metric-card glass" style={{background: 'rgba(255,255,255,0.4)'}}>
                  <div className="metric-icon" style={{background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8'}}><Package /></div>
                  <div><h3>Lifetime Orders</h3><p className="metric-val">{metrics?.totalOrders || 0}</p></div>
                </div>
                <div className="metric-card glass" style={{background: 'rgba(255,255,255,0.4)'}}>
                  <div className="metric-icon" style={{background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e'}}><TrendingUp /></div>
                  <div><h3>Lifetime Revenue</h3><p className="metric-val">₹{metrics?.revenue?.toLocaleString() || 0}</p></div>
                </div>
                <div className="metric-card glass" style={{background: 'rgba(255,255,255,0.4)'}}>
                  <div className="metric-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><IndianRupee /></div>
                  <div><h3>Today's Sales</h3><p className="metric-val">₹{metrics?.todayRevenue?.toLocaleString() || 0}</p></div>
                </div>
                <div className="metric-card glass" style={{background: metrics?.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.4)'}}>
                  <div className="metric-icon" style={{background: metrics?.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: metrics?.lowStockCount > 0 ? '#ef4444' : '#94a3b8'}}><AlertCircle /></div>
                  <div><h3>Stock Alerts</h3><p className="metric-val" style={{color: metrics?.lowStockCount > 0 ? '#ef4444' : 'inherit'}}>{metrics?.lowStockCount || 0}</p></div>
                </div>
              </div>

              <div className="dashboard-activity-grid mt-8" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
                {/* Recent Orders Card */}
                <div className="activity-card glass" style={{padding: '1.5rem', borderRadius: '1rem', background: 'white'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Clock size={20} color="#6366f1"/> Recent Orders</h3>
                    <button className="text-btn" onClick={() => setActiveTab('orders')} style={{fontSize: '0.85rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer'}}>View All</button>
                  </div>
                  <div className="recent-list">
                    {metrics?.recentOrders?.length > 0 ? (
                      metrics.recentOrders.filter(Boolean).map(o => (
                        <div key={o.id} style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9'}}>
                          <div>
                            <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{o.customerName}</div>
                            <div style={{fontSize: '0.75rem', color: '#64748b'}}>{o.orderTrackingId}</div>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <div style={{fontWeight: 600, fontSize: '0.9rem'}}>₹{o.totalAmount}</div>
                            <div style={{fontSize: '0.75rem', color: o.status === 'DELIVERED' ? '#10b981' : '#f59e0b'}}>{o.status}</div>
                          </div>
                        </div>
                      ))
                    ) : <p className="text-muted" style={{fontSize: '0.9rem', color: '#94a3b8'}}>No recent orders found.</p>}
                  </div>
                </div>

                {/* Low Stock Alerts Card */}
                <div className="activity-card glass" style={{padding: '1.5rem', borderRadius: '1rem', background: 'white'}}>
                  <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}><AlertCircle size={20} color="#ef4444"/> Inventory Alerts</h3>
                  <div className="stock-list">
                    {metrics?.lowStockProducts?.length > 0 ? (
                      metrics.lowStockProducts.filter(Boolean).map(p => (
                        <div key={p.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9'}}>
                           <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                              <img src={p.imageUrl} alt={p.name} style={{width: 32, height: 32, borderRadius: '4px', objectFit: 'cover'}} />
                              <div style={{fontWeight: 500, fontSize: '0.9rem'}}>{p.name}</div>
                           </div>
                           <div style={{padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600}}>
                              {p.stockQuantity} Left
                           </div>
                        </div>
                      ))
                    ) : <p className="text-muted" style={{fontSize: '0.9rem', color: '#94a3b8'}}>All products effectively stocked.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="products-tab animate-fade-in">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h2>Product Catalog</h2>
                <button className="btn btn-primary" onClick={() => { setEditingProductId(null); setProductForm({ name: '', description: '', price: '', weight: '', stockQuantity: '', imageUrl: '' }); setImageFile(null); setIsProductModalOpen(true); }}>
                  <Plus size={18}/> Add Product
                </button>
              </div>

              {!isProductModalOpen ? (
                <table className="admin-table w-full text-left mt-4">
                  <thead>
                    <tr><th>ID</th><th>Image</th><th>Name</th><th>Stock</th><th>Price</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {Array.isArray(products) && products.length > 0 ? products.filter(Boolean).map(p => (
                      <tr key={p?.id || Math.random()}>
                        <td>#{p?.id}</td>
                        <td><img src={p?.imageUrl || '/assets/jaggery_block.png'} alt={p?.name} style={{width: 40, height: 40, borderRadius: '4px', objectFit: 'cover'}}/></td>
                        <td style={{fontWeight: 600}}>{p?.name}</td>
                        <td>{p?.stockQuantity || 0} Units</td>
                        <td>₹{p?.price || 0}</td>
                        <td>
                          <button className="action-btn" onClick={() => openEditModal(p)}><Edit size={18}/></button>
                          <button className="action-btn text-red" onClick={() => handleProductDelete(p?.id)}><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No products found in catalog.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="product-form-container mt-4" style={{background: '#fafaf9', padding: '2rem', borderRadius: '1rem'}}>
                  <h3>{editingProductId ? 'Edit Product Configuration' : 'Create New Product'}</h3>
                  <form onSubmit={handleProductSubmit} className="mt-4">
                    <div className="grid" style={{gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem'}}>
                      <div className="input-group">
                        <label className="input-label">Product Name</label>
                        <input className="input-field" value={productForm.name} onChange={e=>setProductForm({...productForm, name: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Price (₹)</label>
                        <input type="number" className="input-field" value={productForm.price} onChange={e=>setProductForm({...productForm, price: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Weight Category</label>
                        <input className="input-field" value={productForm.weight} onChange={e=>setProductForm({...productForm, weight: e.target.value})} placeholder="e.g. 1 kg" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Stock Quantity</label>
                        <input type="number" min="0" className="input-field" value={productForm.stockQuantity} onChange={e=>setProductForm({...productForm, stockQuantity: e.target.value})} required />
                      </div>
                    </div>
                    
                    <div className="input-group mt-2">
                       <label className="input-label">Description Payload</label>
                       <textarea className="input-field" rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                    </div>

                    <div className="input-group mt-2" style={{border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '0.5rem', background: '#fff', textAlign: 'center'}}>
                       <ImageIcon size={32} color="#94a3b8" style={{margin: '0 auto 0.5rem'}}/>
                       <label className="input-label">Upload Product Image</label>
                       <input type="file" onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                          }
                       }} style={{fontSize: '0.9rem'}}/>
                       {productForm.imageUrl && !imageFile && <p style={{fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem'}}>Currently linked: {productForm.imageUrl}</p>}
                    </div>

                    <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                      <button type="submit" className="btn btn-primary">{isSubmitting ? 'Syncing...' : 'Save Product'}</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-tab animate-fade-in">
              <h2>Order Fulfillment Queue</h2>
              <table className="admin-table w-full text-left mt-4">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date & Time</th><th>Actions</th></tr></thead>
                <tbody>
                  {Array.isArray(orders) && orders.length > 0 ? orders.filter(Boolean).map(order => (
                    <tr key={order?.id || Math.random()}>
                      <td>{order?.orderTrackingId || `#${order?.id}`}</td>
                      <td>
                        <div style={{fontWeight: 600}}>{order?.customerName || 'Guest'}</div>
                        <div style={{fontSize: '0.8rem', color: '#334155'}}>{order?.phoneNumber || 'N/A'}</div>
                      </td>
                      <td>
                        <select 
                          className="status-select" 
                          value={order?.status || 'PENDING'} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem'}}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td>₹{order?.totalAmount || 0}</td>
                      <td>{order?.orderDate ? new Date(order.orderDate).toLocaleString('en-GB', { hour12: false }) : 'N/A'}</td>
                      <td>
                        {sessionUser?.role === 'ROLE_SUPER_ADMIN' && (
                          <button className="action-btn text-red" onClick={() => handleOrderDelete(order.id)} title="Delete Order">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No orders found in queue.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
              <div className="users-tab animate-fade-in">
                <h2>Registered Users & CRM</h2>
                <table className="admin-table w-full text-left mt-4">
                  <thead><tr><th>User ID</th><th>Name</th><th>Email / Phone</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {Array.isArray(users) && users.filter(u => u && u.role === 'ROLE_USER').length > 0 ? users.filter(u => u && u.role === 'ROLE_USER').map(user => (
                      <tr key={user?.id || Math.random()}>
                        <td>#{user?.id}</td>
                        <td style={{fontWeight: 600}}>{user?.name || 'User'}</td>
                        <td>
                          <div>{user?.email}</div>
                          <div style={{fontSize: '0.8rem', color: '#64748b'}}>{user?.phone || 'No Phone'}</div>
                        </td>
                        <td><span className="badge">{user?.role}</span></td>

                        <td>
                           <div style={{display: 'flex', gap: '0.5rem'}}>
                              <button className="action-btn" onClick={() => viewUserHistory(user)} title="View CRM History">
                                 <ExternalLink size={18} />
                              </button>
                              {sessionUser?.role === 'ROLE_SUPER_ADMIN' && (
                                <>
                                  <button className="action-btn" onClick={() => openResetPassword(user)} title="Reset Password">
                                    <Lock size={18} />
                                  </button>
                                  <button className="action-btn" onClick={() => openUserEdit(user)} title="Edit Details">
                                    <Edit size={18} />
                                  </button>
                                  <button className="action-btn text-red" onClick={() => handleUserDelete(user.id)} title="Delete User">
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No registered customers found.</td></tr>
                    )}
                  </tbody>
                </table>

                {isEditingUser && (
                  <div className="crm-modal-overlay">
                    <div className="crm-modal-content glass" style={{maxWidth: '500px'}}>
                      <div className="modal-header">
                        <h3>Edit User: {isEditingUser.name}</h3>
                        <button onClick={() => setIsEditingUser(null)} className="close-btn"><X /></button>
                      </div>
                      <form onSubmit={handleUserUpdate} className="mt-4">
                         <div className="input-group">
                           <label className="input-label">Name</label>
                           <input className="input-field" value={userEditForm.name} onChange={e=>setUserEditForm({...userEditForm, name: e.target.value})} />
                         </div>
                         <div className="input-group">
                           <label className="input-label">Phone</label>
                           <input className="input-field" value={userEditForm.phone} onChange={e=>setUserEditForm({...userEditForm, phone: e.target.value})} />
                         </div>
                         <div className="input-group">
                           <label className="input-label">Address</label>
                           <input className="input-field" value={userEditForm.address} onChange={e=>setUserEditForm({...userEditForm, address: e.target.value})} />
                         </div>
                         <div className="input-group">
                           <label className="input-label">System Role</label>
                           <select className="input-field" value={userEditForm.role} onChange={e=>setUserEditForm({...userEditForm, role: e.target.value})}>
                              <option value="ROLE_USER">Customer</option>
                              <option value="ROLE_ADMIN">Staff Admin</option>
                              <option value="ROLE_SUPER_ADMIN">Super User</option>
                           </select>
                         </div>
                         <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                            <button type="submit" className="btn btn-primary" disabled={isCrmSaving}>{isCrmSaving ? 'Saving...' : 'Update Profile'}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditingUser(null)}>Cancel</button>
                         </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Reset Password Modal */}
                {isResetPasswordModalOpen && selectedUserForReset && (
                  <div className="crm-modal-overlay">
                    <div className="crm-modal-content glass" style={{maxWidth: '400px'}}>
                      <div className="modal-header">
                        <h3>Reset Password: {selectedUserForReset.name}</h3>
                        <button onClick={() => setIsResetPasswordModalOpen(false)} className="close-btn"><X /></button>
                      </div>
                      <form onSubmit={handlePasswordReset} className="mt-4">
                         <div className="input-group">
                           <label className="input-label">New Password</label>
                           <input type="text" className="input-field" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Enter new password" required />
                         </div>
                         <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                            <button type="submit" className="btn btn-primary" disabled={isResettingPassword}>{isResettingPassword ? 'Saving...' : 'Reset Password'}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsResetPasswordModalOpen(false)}>Cancel</button>
                         </div>
                      </form>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'staff' && (
             <div className="staff-tab animate-fade-in">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2>Employee Management</h2>
                  <button className="btn btn-primary" onClick={() => setIsStaffModalOpen(true)}>
                    <Plus size={18}/> Add New Employee
                  </button>
                </div>

                <table className="admin-table w-full text-left mt-4">
                  <thead><tr><th>Emp ID</th><th>Name</th><th>Contact Details</th><th>Role</th><th>Password</th><th>Actions</th></tr></thead>
                  <tbody>
                    {Array.isArray(staff) && staff.length > 0 ? staff.filter(Boolean).map(s => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{fontWeight: 600}}>{s.name}</td>
                        <td>
                          <div>{s.email}</div>
                          <div style={{fontSize: '0.8rem', color: '#64748b'}}>{s.phone || 'N/A'}</div>
                        </td>
                        <td><span className="badge" style={s.role === 'ROLE_SUPER_ADMIN' ? {background: '#fef08a', color: '#854d0e'} : {background: '#dcfce7', color: '#166534'}}>{s.role}</span></td>
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style={{fontFamily: 'monospace', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: temporaryPasswords[s?.id] ? '#0f172a' : '#94a3b8'}}>
                              {temporaryPasswords[s?.id] || '••••••••'}
                            </span>
                          </div>
                        </td>
                        <td>
                           <div style={{display: 'flex', gap: '0.5rem'}}>
                             <button className="action-btn" onClick={() => openResetPassword(s)} title="Reset Password">
                               <Lock size={18} />
                             </button>
                             {s.id !== sessionUser?.id && (
                               <button className="action-btn text-red" onClick={() => handleStaffDelete(s.id)}><Trash2 size={18} /></button>
                             )}
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No staff members found.</td></tr>
                    )}
                  </tbody>
                </table>

                {isStaffModalOpen && (
                   <div className="crm-modal-overlay">
                      <div className="crm-modal-content glass" style={{maxWidth: '500px'}}>
                        <div className="modal-header">
                           <h3>Onboard New Employee</h3>
                           <button onClick={() => setIsStaffModalOpen(false)} className="close-btn"><X /></button>
                        </div>
                        <form onSubmit={handleStaffSubmit} className="mt-4">
                           <div className="input-group">
                             <label className="input-label">Full Name</label>
                             <input className="input-field" required value={staffForm.name} onChange={e=>setStaffForm({...staffForm, name: e.target.value})} />
                           </div>
                           <div className="input-group">
                             <label className="input-label">Work Email</label>
                             <input type="email" className="input-field" required value={staffForm.email} onChange={e=>setStaffForm({...staffForm, email: e.target.value})} />
                           </div>
                           <div className="input-group">
                             <label className="input-label">Phone Number</label>
                             <input type="tel" className="input-field" required maxLength="10" value={staffForm.phone} onChange={e=>setStaffForm({...staffForm, phone: e.target.value.replace(/\D/g, '')})} placeholder="10-digit mobile number" />
                           </div>
                           <div className="input-group">
                             <label className="input-label">Temporary Password</label>
                             <input type="password" className="input-field" required value={staffForm.password} onChange={e=>setStaffForm({...staffForm, password: e.target.value})} />
                           </div>
                           <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Employee Profile'}</button>
                              <button type="button" className="btn btn-secondary" onClick={() => setIsStaffModalOpen(false)}>Cancel</button>
                           </div>
                        </form>
                      </div>
                   </div>
                )}
             </div>
          )}
          {activeTab === 'inquiries' && (
             <div className="inquiries-tab animate-fade-in">
                <h2>Customer Lead Inquiries</h2>
                <table className="admin-table w-full text-left mt-4">
                  <thead><tr><th>Date</th><th>Customer</th><th>Email Address</th><th>Contact No.</th><th>Message</th><th>Status</th></tr></thead>
                  <tbody>
                    {Array.isArray(inquiries) && inquiries.filter(Boolean).length > 0 ? inquiries.filter(Boolean).map(inq => (
                      <tr key={inq.id} style={inq.status === 'NEW' ? {background: '#f0f9ff'} : {}}>
                        <td style={{fontSize: '0.85rem'}}>{new Date(inq.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{fontWeight: 600}}>{inq.name}</div>
                        </td>
                        <td>
                           <div style={{fontSize: '0.9rem'}}>{inq.email}</div>
                        </td>
                        <td>
                           <div style={{fontSize: '0.9rem', fontWeight: 600}}>{inq.phoneNumber || 'N/A'}</div>
                        </td>
                        <td style={{maxWidth: '300px', fontSize: '0.9rem'}}>{inq.message}</td>
                        <td>
                          <select 
                            className="status-select" 
                            value={inq.status} 
                            onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                            style={{padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                          >
                            <option value="NEW">NEW</option>
                            <option value="READ">READ</option>
                            <option value="RESPONDED">RESPONDED</option>
                          </select>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No customer inquiries found.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          )}

          {/* User History CRM Modal */}
          {isHistoryModalOpen && selectedUserOrders && (
            <div className="crm-modal-overlay">
              <div className="crm-modal-content glass animate-fade-in">
                <div className="modal-header">
                  <h3>Customer Order Profile: {selectedUserOrders.user.name}</h3>
                  <button onClick={() => setIsHistoryModalOpen(false)} className="close-btn"><X /></button>
                </div>
                <div className="modal-body mt-4">
                  <p><strong>Email:</strong> {selectedUserOrders.user.email}</p>
                  <p><strong>Phone:</strong> {selectedUserOrders.user.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {selectedUserOrders.user.address || 'N/A'}</p>
                  
                  <h4 className="mt-6">Lifetime Orders ({selectedUserOrders.orders.length})</h4>
                  <div className="history-list mt-2">
                    {isLoadingHistory ? (
                      <p>Fetching transaction history...</p>
                    ) : selectedUserOrders.orders.length > 0 ? (
                      selectedUserOrders.orders.map(o => (
                        <div key={o.id} style={{padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
                          <span>Order ID {o.orderTrackingId || `#${o.id}`} - {new Date(o.orderDate).toLocaleString('en-GB', { hour12: false })}</span>
                          <span style={{fontWeight: 600}}>₹{o.totalAmount} ({o.status})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mt-2">No transaction history found for this account.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
