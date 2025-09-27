import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Terms of Service
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Please read these terms carefully before using TacktixEdge. By accessing or using the
                platform, you agree to be bound by these Terms of Service.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">1. Eligibility</h2>
                <p className="text-foreground/80">
                  You must be at least 18 years old and legally capable of entering into a binding
                  agreement in your jurisdiction. By creating an account, you represent and warrant
                  that you meet these requirements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">2. Accounts</h2>
                <p className="text-foreground/80">
                  You are responsible for maintaining the confidentiality of your account credentials
                  and for all activities that occur under your account. You agree to provide accurate
                  information and keep it up to date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">3. Skill-based Matches</h2>
                <p className="text-foreground/80">
                  TacktixEdge operates skill-based challenges and tournaments. Outcomes depend on
                  player skill and adherence to rules. You agree to follow game rules, submit fair
                  results, and comply with dispute procedures.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">4. Payments, Fees and Withdrawals</h2>
                <p className="text-foreground/80">
                  Deposits and withdrawals must follow platform instructions. Platform fees may apply
                  to winnings as disclosed in the product UI. Suspicious activity may result in
                  holds, reversals, or account reviews.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">5. Prohibited Conduct</h2>
                <p className="text-foreground/80">
                  You may not engage in cheating, collusion, use of emulators where prohibited, abuse,
                  or any activity that harms other users or the platform. Violations may result in
                  suspension or termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">6. Disputes</h2>
                <p className="text-foreground/80">
                  If there is a conflict over match results, our dispute process will be used to
                  review submitted evidence and issue a fair resolution. Decisions made by TacktixEdge
                  are final for platform outcomes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">7. Termination</h2>
                <p className="text-foreground/80">
                  We may suspend or terminate accounts that violate these terms, applicable laws, or
                  platform policies. You may close your account at any time, subject to settlement of
                  any pending transactions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">8. Changes to Terms</h2>
                <p className="text-foreground/80">
                  We may update these terms from time to time. Continued use after updates indicates
                  acceptance. Material changes will be communicated through the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">9. Contact</h2>
                <p className="text-foreground/80">
                  Questions about these terms? Contact support@tacktixedge.com.
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

export default TermsOfService;
