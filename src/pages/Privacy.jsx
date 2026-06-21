import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-24">
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Information We Collect</h2>
          <p>We collect account information (name, email, phone), restaurant data (menu, orders, customers), and usage data.</p>
          <h2>2. How We Use Your Information</h2>
          <p>Your information is used to provide and improve our services, process transactions, and communicate with you.</p>
          <h2>3. Data Storage & Security</h2>
          <p>All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information.</p>
          <h2>4. Data Sharing</h2>
          <p>We do not sell your personal data. We may share data with service providers who assist in operating our platform.</p>
          <h2>5. Your Rights</h2>
          <p>You may access, update, or delete your data at any time through your account settings.</p>
          <h2>6. Contact</h2>
          <p>For privacy-related inquiries, contact us at privacy@ritambharat.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
