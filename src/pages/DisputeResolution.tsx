import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const DisputeResolution = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Dispute Resolution
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                How disputes are handled on TacktixEdge and how to submit your proof.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">When to Open a Dispute</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Opponent’s reported results don’t match the scoreboard</li>
                  <li>Proof not uploaded within the allowed timeframe</li>
                  <li>Rule violations (e.g., emulators, banned items, wrong map)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">How to Submit Proof</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Submit clear screenshots of the final result screen</li>
                  <li>Include timestamps, lobby codes, and relevant context</li>
                  <li>Upload within the time limit to avoid auto-decisions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Review & Decision</h2>
                <p className="text-foreground/80">
                  Our admin team reviews evidence as quickly as possible and issues a fair decision.
                  Decisions may include refunds, forfeits, or match replays.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Timelines</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Evidence upload window: generally up to 2 hours from match end</li>
                  <li>Admin review: typically within 2–24 hours depending on complexity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Escalation</h2>
                <p className="text-foreground/80">
                  For high-stake disputes or suspected fraud, contact Support with additional proof.
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

export default DisputeResolution;
