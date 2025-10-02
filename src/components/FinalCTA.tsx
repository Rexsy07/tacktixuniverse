import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Users, ArrowRight, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartPlayingNow = () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate('/games');
  };

  const handleViewGames = () => {
    navigate('/games');
  };

  const ctaFeatures = [
    {
      icon: Zap,
      text: "Start earning instantly"
    },
    {
      icon: Trophy,
      text: "Join 10K+ active gamers"
    },
    {
      icon: Users,
      text: "Fair play guaranteed"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main CTA Card */}
        <Card className="glass-card max-w-4xl mx-auto text-center overflow-hidden glow-primary">
          <div className="p-12 lg:p-16">
            {/* Badge */}
            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground mb-6 px-4 py-1 text-sm font-semibold">
              🚀 Join the Revolution
            </Badge>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                Ready to Prove
              </span>
              <br />
              <span className="text-foreground">Your Edge?</span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join TacktixEdge today and turn your gaming skills into real money. 
              <span className="text-primary font-semibold"> Nigeria's #1 competitive gaming platform </span>
              is waiting for you.
            </p>

            {/* Feature List */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {ctaFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-2 text-foreground/70">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                className="px-12 py-4 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary pulse-glow transition-all duration-300 group"
                onClick={handleStartPlayingNow}
              >
                <Gamepad2 className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                Start Playing Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="px-12 py-4 text-lg glass-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={handleViewGames}
              >
                <Trophy className="mr-3 h-6 w-6" />
                View Games
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-foreground/60">
              <div className="flex items-center space-x-1">
                <span className="text-success">✓</span>
                <span>Free to join</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-success">✓</span>
                <span>Instant withdrawals</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-success">✓</span>
                <span>24/7 support</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-success">✓</span>
                <span>Fair play guaranteed</span>
              </div>
            </div>
          </div>

          {/* Decorative Border */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
        </Card>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">10K+</div>
            <div className="text-sm text-foreground/70">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-1">₦50M+</div>
            <div className="text-sm text-foreground/70">Paid Out</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">99.9%</div>
            <div className="text-sm text-foreground/70">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-foreground/70">Support</div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mt-12">
          <p className="text-foreground/60 mb-4">
            Trusted by gamers across Nigeria
          </p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <span className="text-2xl">🇳🇬</span>
            <span className="text-lg font-semibold">Lagos</span>
            <span className="text-lg font-semibold">Abuja</span>
            <span className="text-lg font-semibold">Kano</span>
            <span className="text-lg font-semibold">Port Harcourt</span>
            <span className="text-lg font-semibold">Ibadan</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;