import React from 'react';
import './Policies.css';

const Policies = () => {
  return (
    <div className="policies-container animate-fade-in container">
      <h1 className="policies-title">Legal Policies</h1>
      
      <section className="policy-section">
        <h2>1. Privacy Policy</h2>
        <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
        <p>At Trimurti Jaggery, we are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and protect your data when you use our website and services.</p>
        
        <h3>Information We Collect</h3>
        <ul>
          <li><strong>Personal Information:</strong> When you register for an account, place an order, or contact us, we collect personal details such as your name, email address, phone number, and shipping/billing address.</li>
          <li><strong>Payment Information:</strong> We do not store your full credit card details. Payment transactions are processed securely through our trusted third-party payment gateways.</li>
          <li><strong>Usage Data:</strong> We collect non-personal data regarding how you interact with our website, such as IP addresses, browser types, and pages visited, to improve our user experience.</li>
        </ul>

        <h3>How We Use Your Information</h3>
        <ul>
          <li>To process and fulfill your orders, including sending order confirmations and shipping updates.</li>
          <li>To communicate with you regarding your inquiries, support requests, or important account updates.</li>
          <li>To improve our website, product offerings, and customer service based on your feedback and usage patterns.</li>
          <li>To send promotional emails or newsletters (you may opt-out at any time).</li>
        </ul>

        <h3>Data Sharing and Security</h3>
        <p>We do not sell, trade, or rent your personal information to third parties. We only share your data with trusted partners (e.g., shipping carriers and payment processors) strictly for the purpose of fulfilling your orders. We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, or disclosure.</p>
      </section>

      <section className="policy-section">
        <h2>2. Terms and Conditions</h2>
        <p>By accessing and using the Trimurti Jaggery website, you accept and agree to be bound by the following Terms and Conditions.</p>

        <h3>Use of the Website</h3>
        <ul>
          <li>You must be at least 18 years of age to make purchases on our website, or have the consent of a parent or guardian.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
        </ul>

        <h3>Products and Pricing</h3>
        <ul>
          <li>We strive to ensure that all product descriptions, images, and pricing are accurate. However, errors may occasionally occur. We reserve the right to correct any errors and to change or update information at any time without prior notice.</li>
          <li>Since jaggery is a natural product, slight variations in color, texture, and taste may occur between batches.</li>
          <li>All prices are listed in INR (₹) and are subject to change without notice.</li>
        </ul>

        <h3>Intellectual Property</h3>
        <p>All content on this website, including logos, text, graphics, and images, is the property of Trimurti Jaggery and is protected by applicable copyright and trademark laws. Unauthorized use of this content is strictly prohibited.</p>

        <h3>Limitation of Liability</h3>
        <p>Trimurti Jaggery shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our products or website.</p>
      </section>

      <section className="policy-section">
        <h2>3. Refund and Return Policy</h2>
        <p>Because Trimurti Jaggery provides premium, natural, and perishable food products, our refund and return policy is designed with health, safety, and quality standards in mind.</p>

        <h3>Returns</h3>
        <p>Due to the consumable nature of our products, <strong>we do not accept returns</strong> or exchanges once the product has been dispatched or delivered, unless the item received is incorrect, damaged, or defective.</p>

        <h3>Refunds and Replacements</h3>
        <p>We will gladly offer a replacement or a full refund under the following circumstances:</p>
        <ul>
          <li><strong>Damaged in Transit:</strong> If your package arrives severely damaged, please take clear photos of the packaging and the product and contact us within <strong>48 hours</strong> of delivery.</li>
          <li><strong>Defective or Incorrect Product:</strong> If you receive the wrong product or a product that is spoiled upon arrival, please notify us immediately.</li>
        </ul>

        <h3>Refund Process</h3>
        <ul>
          <li>To initiate a refund or replacement request, please contact our support team at support@trimurtijaggery.com with your Order ID and photographic evidence of the issue.</li>
          <li>Once your request is reviewed and approved, refunds will be processed back to your original method of payment within <strong>5-7 business days</strong>.</li>
        </ul>

        <h3>Cancellations</h3>
        <p>Orders can be cancelled for a full refund <strong>only if they have not yet been dispatched</strong>. Once an order has been handed over to our shipping partner, cancellations are no longer possible.</p>
      </section>
    </div>
  );
};

export default Policies;
