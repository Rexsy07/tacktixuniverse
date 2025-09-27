import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const ResponsibleGaming = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Responsible Gaming
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                We promote healthy, skill-based competition. Play responsibly and within your means.
              </p>
            </div>

            <div className="prose prose-invert max-w-4xl mx-auto space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-2">Our Principles</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Skill-based challenges, not chance-based gambling</li>
                  <li>Fair play, transparency, and safety for all players</li>
                  <li>Tools to help you manage time and spending</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Tools & Controls</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Spending awareness and voluntary limits (on request)</li>
                  <li>Time-out and cool-down recommendations</li>
                  <li>Account closure upon request</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Warning Signs</h2>
                <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                  <li>Playing longer or spending more than intended</li>
                  <li>Chasing losses or neglecting responsibilities</li>
                  <li>Gaming to escape personal issues</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Get Help</h2>
                <p className="text-foreground/80">
                  If you feel your gaming is becoming problematic, consider taking a break and
                  contacting support for guidance. In your region, consult local support resources for
                  responsible gaming assistance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-2">Underage Use</h2>
                <p className="text-foreground/80">
                  TacktixEdge is for adults (18+). We do not permit accounts for minors and may
                  request verification where required.
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

export default ResponsibleGaming;
