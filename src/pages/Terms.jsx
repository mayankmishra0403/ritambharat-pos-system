import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-24">
        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
        <div className="prose prose-invert max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Ritam Bharat POS, you agree to be bound by these Terms of Service.</p>
          <h2>2. Description of Service</h2>
          <p>Ritam Bharat POS provides restaurant management software including POS, inventory, ordering, and analytics.</p>
          <h2>3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
          <h2>4. Limitation of Liability</h2>
          <p>Ritam Bharat POS shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.</p>
          <h2>6. Contact</h2>
          <p>For questions about these terms, contact us at support@ritambharat.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
