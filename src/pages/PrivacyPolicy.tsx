import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Privacy Policy
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Your privacy matters. This policy explains what we collect, how we use it, and your
                choices regarding your information on TacktixEdge.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">1. Information We Collect</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Account details (username, email/phone, profile information)</li>
                  <li>Gameplay data (matches, results, uploads, disputes)</li>
                  <li>Payment-related metadata (for deposits/withdrawals)</li>
                  <li>Device and usage data (logs, analytics, cookies)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">2. How We Use Information</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Provide and maintain the platform</li>
                  <li>Process transactions and prevent fraud</li>
                  <li>Resolve disputes and ensure fair play</li>
                  <li>Improve features, personalize experience, and communicate updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">3. Sharing of Information</h2>
                <p className="text-foreground/80">
                  We may share information with service providers (e.g., payment partners), for legal
                  compliance, or to protect rights and safety. We do not sell your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">4. Data Security</h2>
                <p className="text-foreground/80">
                  We implement reasonable technical and organizational measures to protect your data.
                  No system is 100% secure; please use strong passwords and protect your devices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">5. Data Retention</h2>
                <p className="text-foreground/80">
                  We retain data for as long as necessary for the purposes described, to comply with
                  legal obligations, resolve disputes, and enforce agreements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">6. Your Rights</h2>
                <p className="text-foreground/80">
                  Depending on your jurisdiction, you may have rights to access, correct, delete, or
                  restrict processing of your personal data, and to withdraw consent where applicable.
                  Contact us to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">7. Cookies</h2>
                <p className="text-foreground/80">
                  We use cookies and similar technologies for authentication, preferences, and
                  analytics. You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">8. Contact</h2>
                <p className="text-foreground/80">
                  Questions or requests? Contact support@tacktixedge.com.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
