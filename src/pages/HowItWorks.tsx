import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, Gamepad2, Camera, Trophy, ArrowRight, 
  Shield, Zap, Clock, Users, CheckCircle, AlertTriangle,
  Banknote, Smartphone, Upload, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorksPage = () => {
  const steps = [
    {
      id: 1,
      icon: CreditCard,
      title: "Fund Your Wallet",
      description: "Deposit money securely via bank transfer with manual verification for maximum safety.",
      details: [
        "Transfer money to our provided bank account",
        "Include your unique username in transfer narration",
        "Admin manually verifies and credits your wallet",
        "Funds typically appear within 30 minutes during business hours"
      ],
      color: "text-primary",
      glowColor: "glow-primary",
      timeEstimate: "5-30 minutes"
    },
    {
      id: 2,
      icon: Gamepad2,
      title: "Create or Join Challenge",
      description: "Set up matches in your favorite games or join existing challenges from other players.",
      details: [
        "Choose from CODM, PUBG, Free Fire, EA FC, or PES",
        "Set stake amount (₦200 - ₦10,000)",
        "Define specific game rules and conditions",
        "Money is instantly locked in secure escrow"
      ],
      color: "text-accent",
      glowColor: "glow-accent",
      timeEstimate: "2-5 minutes"
    },
    {
      id: 3,
      icon: Camera,
      title: "Play & Upload Proof",
      description: "Complete your match and upload clear screenshot evidence of the final results.",
      details: [
        "Play your match according to agreed rules",
        "Take clear screenshots of final scores/results",
        "Upload evidence through our secure system",
        "Both players must submit proof for verification"
      ],
      color: "text-success",
      glowColor: "glow-success",
      timeEstimate: "10-60 minutes"
    },
    {
      id: 4,
      icon: Trophy,
      title: "Get Paid Instantly",
      description: "Winner's wallet is credited automatically. Withdraw to your Nigerian bank account anytime.",
      details: [
        "System compares both players' submissions",
        "Winner receives full stake (minus small platform fee)",
        "Instant wallet credit upon result verification",
        "Withdraw to any Nigerian bank within 24 hours"
      ],
      color: "text-primary",
      glowColor: "glow-primary",
      timeEstimate: "Instant - 24 hours"
    }
  ];

  const depositFlow = [
    {
      icon: Banknote,
      title: "Get Bank Details",
      description: "Click 'Deposit' to receive our bank account details and your unique reference code."
    },
    {
      icon: Smartphone,
      title: "Make Transfer",
      description: "Use your mobile banking app to transfer money. Include your username in the narration."
    },
    {
      icon: CheckCircle,
      title: "Admin Verification",
      description: "Our team manually verifies your transfer and credits your TacktixEdge wallet."
    }
  ];

  const withdrawalFlow = [
    {
      icon: CreditCard,
      title: "Request Withdrawal",
      description: "Enter your bank details and withdrawal amount in your dashboard."
    },
    {
      icon: Shield,
      title: "Security Check",
      description: "Our team verifies your identity and bank details for security."
    },
    {
      icon: Award,
      title: "Receive Payment",
      description: "Money is sent directly to your Nigerian bank account within 24 hours."
    }
  ];

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "All match stakes are locked in secure escrow until results are verified. No instant scams possible.",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Manual Verification",
      description: "Every deposit and withdrawal is manually verified by our team for maximum security and fraud prevention.",
      color: "text-accent"
    },
    {
      icon: Users,
      title: "Dispute Resolution",
      description: "Professional admin team reviews all disputes within 2 hours during peak times. Fair play guaranteed.",
      color: "text-success"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  How TacktixEdge Works
                </span>
              </h1>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                From deposit to payout in 4 simple steps. Fair, secure, and transparent gaming for all Nigerian players.
              </p>
            </div>
          </div>
        </section>

        {/* Main Steps */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

                        {/* Time Estimate */}
                        <Badge variant="outline" className="mb-4">
                          <Clock className="mr-1 h-3 w-3" />
                          {step.timeEstimate}
                        </Badge>

                        {/* Details */}
                        <div className="text-left">
                          <ul className="text-xs text-foreground/50 space-y-1">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-success flex-shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
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
          </div>
        </section>

        {/* Detailed Deposit Process */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Deposit Process
                </span>
              </h2>
              <p className="text-foreground/70">
                Step-by-step guide to funding your TacktixEdge wallet
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {depositFlow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="glass-card text-center">
                    <div className="p-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Deposit Warning */}
            <Card className="glass-card border-amber-500/20">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold mb-2 text-amber-500">Important Deposit Information</h3>
                    <ul className="text-sm text-foreground/70 space-y-1">
                      <li>• Always include your exact TacktixEdge username in the transfer narration</li>
                      <li>• Deposits are processed manually during business hours (9 AM - 9 PM WAT)</li>
                      <li>• Minimum deposit: ₦500 | Maximum deposit: ₦50,000 per transaction</li>
                      <li>• Transfers from unregistered bank accounts may be delayed for verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Withdrawal Process */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Withdrawal Process
                </span>
              </h2>
              <p className="text-foreground/70">
                Get your winnings sent directly to your Nigerian bank account
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {withdrawalFlow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="glass-card text-center">
                    <div className="p-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent/20 to-success/20 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Safety Features */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Your Safety is Our Priority
                </span>
              </h2>
              <p className="text-foreground/70">
                Multiple layers of protection keep your money and gaming experience secure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {safetyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="glass-card text-center">
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
                          <Icon className={`h-8 w-8 ${feature.color}`} />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                      <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="font-bold mb-3">How long do deposits take?</h3>
                  <p className="text-foreground/70 text-sm">
                    Deposits are processed manually within 30 minutes during business hours (9 AM - 9 PM WAT). 
                    Outside these hours, deposits are processed first thing the next business day.
                  </p>
                </div>
              </Card>

              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="font-bold mb-3">What if there's a dispute?</h3>
                  <p className="text-foreground/70 text-sm">
                    Our admin team reviews disputes within 2 hours during peak times. We examine all submitted 
                    evidence and make fair decisions based on the agreed rules.
                  </p>
                </div>
              </Card>

              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="font-bold mb-3">Are there any fees?</h3>
                  <p className="text-foreground/70 text-sm">
                    We charge a small 5% platform fee on winnings. There are no deposit fees, and withdrawal 
                    fees depend on your chosen bank (typically ₦50-₦100).
                  </p>
                </div>
              </Card>

              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="font-bold mb-3">Which banks do you support?</h3>
                  <p className="text-foreground/70 text-sm">
                    We support all major Nigerian banks including GTBank, Access, First Bank, UBA, Zenith, 
                    and many others. Fintech wallets like Opay and Palmpay are also supported.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card max-w-4xl mx-auto p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Your Gaming Journey?
              </h2>
              <p className="text-foreground/70 mb-8">
                Join thousands of Nigerian gamers who trust TacktixEdge for fair, secure, and rewarding gameplay.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                    <Trophy className="mr-2 h-5 w-5" />
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/games">
                  <Button size="lg" variant="outline" className="glass-button">
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    Browse Games
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HowItWorksPage;