import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Gamepad2, Camera, Trophy, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: CreditCard,
      title: "Deposit",
      description: "Fund your wallet securely via bank transfer. Manual verification ensures your money is safe.",
      details: "Transfer to our account with your username in the narration. Funds appear within 30 minutes.",
      color: "text-primary",
      glowColor: "glow-primary"
    },
    {
      id: 2,
      icon: Gamepad2,
      title: "Challenge",
      description: "Create or join matches across CODM, PUBG, Free Fire, EA FC & PES. Set your stakes and rules.",
      details: "Choose game mode, stake amount (₦200-₦10,000), and specific rules. Money is locked in escrow.",
      color: "text-accent",
      glowColor: "glow-accent"
    },
    {
      id: 3,
      icon: Camera,
      title: "Play & Upload",
      description: "Play your match and upload screenshot proof of results. Both players must submit evidence.",
      details: "Take clear screenshots of final scores/results. Our system compares both submissions.",
      color: "text-success",
      glowColor: "glow-success"
    },
    {
      id: 4,
      icon: Trophy,
      title: "Get Paid",
      description: "Winner's wallet is credited instantly. Withdraw to your Nigerian bank account anytime.",
      details: "Automatic payout on agreement. Disputes reviewed by admins within 24 hours.",
      color: "text-primary",
      glowColor: "glow-primary"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            From deposit to payout in 4 simple steps. Fair, secure, and transparent gaming for all Nigerian players.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="relative">
                <Card className={`glass-card text-center game-card ${step.glowColor} h-full`}>
                  <div className="p-6">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm ${step.glowColor}`}>
                        {step.id}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mb-4 mt-4">
                      <Icon className={`h-12 w-12 mx-auto ${step.color}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 text-foreground">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-foreground/70 mb-4 text-sm leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details */}
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </Card>

                {/* Arrow Connector (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-primary/50 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card text-center">
            <div className="p-6">
              <div className="text-2xl font-bold text-primary mb-2">🔒</div>
              <h4 className="font-semibold mb-2">Escrow Protection</h4>
              <p className="text-sm text-foreground/70">
                Your stake is safely locked until match completion. No instant scams possible.
              </p>
            </div>
          </Card>

          <Card className="glass-card text-center">
            <div className="p-6">
              <div className="text-2xl font-bold text-accent mb-2">⚡</div>
              <h4 className="font-semibold mb-2">Fast Withdrawals</h4>
              <p className="text-sm text-foreground/70">
                Direct payouts to all Nigerian banks. Process within 24 hours maximum.
              </p>
            </div>
          </Card>

          <Card className="glass-card text-center">
            <div className="p-6">
              <div className="text-2xl font-bold text-success mb-2">✅</div>
              <h4 className="font-semibold mb-2">Fair Play Guaranteed</h4>
              <p className="text-sm text-foreground/70">
                Dispute resolution system with admin review. Every match is monitored.
              </p>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="glass-card max-w-2xl mx-auto p-8">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Winning?
            </h3>
            <p className="text-foreground/70 mb-6">
              Join thousands of Nigerian gamers already earning on TacktixEdge. 
              Your skills, your rewards.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary pulse-glow px-8"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Start Playing Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;