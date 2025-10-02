import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Community Guidelines
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Our rules for respectful competition and a safe community.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">Respect & Conduct</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>No harassment, hate speech, or threats</li>
                  <li>Be honest in reporting results and evidence</li>
                  <li>Follow match rules and fair play standards</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Cheating & Exploits</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>No emulators where prohibited, scripts, or exploits</li>
                  <li>Do not attempt to manipulate escrow or payments</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">User Safety</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Protect your account; never share credentials</li>
                  <li>Report abusive behavior or suspected fraud to Support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Enforcement</h2>
                <p className="text-foreground/80">
                  Violations may result in warnings, suspensions, forfeits, or permanent bans.
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

export default CommunityGuidelines;
