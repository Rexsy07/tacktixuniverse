import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, CheckCircle, Lock, Clock, Users, Banknote, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TrustSection = () => {
  const { isAdmin } = useAuth();
  const trustFeatures = [
    {
      icon: Lock,
      title: "Escrow Wallet Protection",
      description: "Your stakes are safely locked in escrow until match completion. No instant scams or fraud possible.",
      details: "Advanced blockchain-inspired escrow system ensures fairness for both players.",
      color: "text-primary",
      glowColor: "glow-primary"
    },
    {
      icon: Zap,
      title: "Lightning Fast Withdrawals",
      description: "Direct payouts to all major Nigerian banks. Process completed within 24 hours maximum.",
      details: "Integration with Flutterwave and Paystack for reliable, fast transactions.",
      color: "text-accent",
      glowColor: "glow-accent"
    },
    {
      icon: CheckCircle,
      title: "Fair Play Guarantee",
      description: "Professional dispute resolution system with admin review. Every match is monitored for fairness.",
      details: "Trained gaming administrators review disputes within 2 hours during peak times.",
      color: "text-success",
      glowColor: "glow-success"
    }
  ];

  const securityStats = [
    {
      icon: Shield,
      value: "99.9%",
      label: "Security Uptime",
      description: "Military-grade encryption"
    },
    {
      icon: Users,
      value: "10K+",
      label: "Trusted Users",
      description: "Growing daily"
    },
    {
      icon: Banknote,
      value: "₦50M+",
      label: "Safely Processed",
      description: "Zero fraud incidents"
    },
    {
      icon: Award,
      value: "24/7",
      label: "Admin Support",
      description: "Always monitoring"
    }
  ];

  const paymentPartners = [
    { name: "Flutterwave", logo: "🟢" },
    { name: "Paystack", logo: "🔵" },
    { name: "GTBank", logo: "🏦" },
    { name: "Access Bank", logo: "🏪" },
    { name: "First Bank", logo: "🏛️" },
    { name: "UBA", logo: "🏢" }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Trust & Security
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Your money and gaming experience are protected by industry-leading security measures and fair play policies.
          </p>
        </div>

        {/* Main Trust Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className={`glass-card text-center game-card ${feature.glowColor} h-full`}>
                <div className="p-6">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 ${feature.glowColor}`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-foreground/70 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Details */}
                  <p className="text-sm text-foreground/50 leading-relaxed">
                    {feature.details}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Security Stats (Admin only) */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {securityStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card text-center">
                  <div className="p-6">
                    <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="font-semibold mb-1">{stat.label}</div>
                    <div className="text-xs text-foreground/50">
                      {stat.description}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* How Security Works */}
        <Card className="glass-card mb-16">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">
              How Our Security Works
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold mb-2">Deposit Verification</h4>
                <p className="text-sm text-foreground/70">
                  Manual verification of all deposits through bank transfer confirmation
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-accent">2</span>
                </div>
                <h4 className="font-semibold mb-2">Escrow Lock</h4>
                <p className="text-sm text-foreground/70">
                  Stakes locked in secure escrow until match results are verified
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-success">3</span>
                </div>
                <h4 className="font-semibold mb-2">Result Verification</h4>
                <p className="text-sm text-foreground/70">
                  Screenshot proof required from both players for match validation
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">4</span>
                </div>
                <h4 className="font-semibold mb-2">Instant Payout</h4>
                <p className="text-sm text-foreground/70">
                  Winner's wallet credited immediately upon verification
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Partners */}
        <div className="text-center mb-12">
          <h3 className="text-xl font-bold mb-6">Trusted Payment Partners</h3>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {paymentPartners.map((partner, index) => (
              <div key={index} className="glass-card p-4 flex items-center space-x-3">
                <span className="text-2xl">{partner.logo}</span>
                <span className="font-semibold">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Compliance */}
        <Card className="glass-card">
          <div className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Legal & Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <Badge variant="outline" className="mb-2">Nigerian Law Compliant</Badge>
                <p className="text-foreground/70">
                  Operated as skill-based gaming platform in accordance with Nigerian regulations
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Data Protection</Badge>
                <p className="text-foreground/70">
                  Full GDPR compliance with secure data handling and privacy protection
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">KYC Verified</Badge>
                <p className="text-foreground/70">
                  Know Your Customer verification for high-value transactions and withdrawals
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TrustSection;