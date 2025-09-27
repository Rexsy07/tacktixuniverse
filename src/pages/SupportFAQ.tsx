import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const SupportFAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Answers to common questions about accounts, payments, and gameplay on TacktixEdge.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">Accounts & Profiles</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>
                    How do I sign up? Use Sign Up, choose a unique username (used for payments), then
                    complete your profile.
                  </li>
                  <li>
                    Can I change my username? Usernames are permanent due to verification ties; other
                    profile fields can be edited.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Deposits & Withdrawals</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Deposits are verified manually during business hours; include your username in narration.</li>
                  <li>Withdrawals are processed within 24 hours to Nigerian bank accounts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Gaming & Matches</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Create challenges with your preferred rules and stakes; funds are held in escrow.</li>
                  <li>Upload clear proof (final scores/screenshots) after each match to avoid disputes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Need More Help?</h2>
                <p className="text-foreground/80">
                  Visit Support Contact for direct assistance.
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

export default SupportFAQ;
