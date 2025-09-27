import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const KYCPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  KYC Policy
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Know Your Customer (KYC) helps us keep TacktixEdge secure and compliant.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">1. When We Collect KYC</h2>
                <p className="text-foreground/80">
                  We may request identity verification for withdrawals, unusual activity, regulatory
                  compliance, or account security reviews.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">2. Documents Required</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Government-issued ID (e.g., national ID, passport, driver’s license)</li>
                  <li>Proof of address (e.g., utility bill, bank statement)</li>
                  <li>Additional information if required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">3. Verification Process</h2>
                <p className="text-foreground/80">
                  We review documents to confirm identity and eligibility. In some cases, we may
                  require live verification or additional checks to comply with regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">4. AML & Compliance</h2>
                <p className="text-foreground/80">
                  We adhere to applicable anti-money laundering (AML) and counter-terrorist financing
                  requirements and cooperate with lawful requests from authorities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">5. Data Handling</h2>
                <p className="text-foreground/80">
                  KYC data is stored securely with restricted access and retained only as long as
                  necessary for compliance and security purposes.
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

export default KYCPolicy;
