import React from 'react';
import { Navigate } from 'react-router-dom';
import { Leaf, Award, Users, Heart } from 'lucide-react';
import './About.css';

const About = () => {
  const sessionUser = JSON.parse(localStorage.getItem('user') || "{}");
  if (sessionUser.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="about-page animate-fade-in container">
      <div className="about-header">
        <h1>Our Heritage & Journey</h1>
        <p>Crafting authentic, chemical-free sweetness since 1980.</p>
      </div>

      <div className="about-content grid glass" style={{padding: '3rem', borderRadius: 'var(--radius-xl)'}}>
        <div className="about-text">
          <h2 style={{color: 'var(--color-primary-dark)', marginBottom: '1.5rem'}}>Trimurti Agro Products</h2>
          <p style={{marginBottom: '1rem', lineHeight: '1.8'}}>
            Welcome to Trimurti Agro Products, a legacy rooted in the rich soils of traditional Indian agriculture. 
            Established in <strong>1980</strong>, we have spent over four decades perfecting the art of extracting the 
            purest, most authentic jaggery directly from organically cultivated sugarcane.
          </p>
          <p style={{marginBottom: '1rem', lineHeight: '1.8'}}>
            What began as a humble, family-owned milling operation has grown into a premier provider of natural jaggery across the region. 
            Unlike industrial sugar refineries, we hold steadfast to our chemical-free extraction process. We utilize natural cleansing agents 
            and traditional deep-boiling cauldrons to ensure that every ounce of vital minerals, vitamins, and unparalleled flavor is preserved 
            in every block, drop, and crystal of our products.
          </p>
          <p style={{lineHeight: '1.8'}}>
             At Trimurti, our mission isn't just about manufacturing sweeteners. It's about delivering a golden, healthy drop of nature directly from our 
             farms to your dining table. Experience the taste of true authenticity.
          </p>
        </div>
        <div className="about-stats grid" style={{gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr)', gap: '1.5rem', alignContent: 'center'}}>
           <div className="stat-card">
              <Leaf size={32} color="#10b981" />
              <h3>100%</h3>
              <span>Organic Sugarcane</span>
           </div>
           <div className="stat-card">
              <Award size={32} color="#f59e0b" />
              <h3>40+</h3>
              <span>Years of Mastery</span>
           </div>
           <div className="stat-card">
              <Users size={32} color="#3b82f6" />
              <h3>10k+</h3>
              <span>Happy Families</span>
           </div>
           <div className="stat-card">
              <Heart size={32} color="#ef4444" />
              <h3>0%</h3>
              <span>Chemical Preservatives</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
