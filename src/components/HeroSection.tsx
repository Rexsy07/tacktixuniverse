import { Button } from "@/components/ui/button";
import { Play, Trophy, Zap } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartPlaying = () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate('/games');
  };

  const handleViewGames = () => {
    navigate('/games');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="TacktixEdge Gaming Arena"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl animate-pulse float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-accent/20 blur-xl animate-pulse float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-primary/30 blur-xl animate-pulse float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent animate-pulse">
              Play. Bet. Win.
            </span>
            <br />
            <span className="text-foreground">
              Dominate Nigeria's <span className="text-primary">#1</span> PvP Arena.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Challenge opponents in <span className="text-primary font-semibold">CODM</span>, 
            <span className="text-accent font-semibold"> PUBG</span>, 
            <span className="text-primary font-semibold"> Free Fire</span>, 
            <span className="text-accent font-semibold"> EA FC</span> & 
            <span className="text-primary font-semibold"> PES</span>. 
            Bet your skills, earn real rewards.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="px-8 py-4 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary pulse-glow transition-all duration-300"
              onClick={handleStartPlaying}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Playing
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg glass-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleViewGames}
            >
              <Trophy className="mr-2 h-5 w-5" />
              View Games
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="glass-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-primary mr-2" />
                <span className="text-2xl font-bold text-primary">₦50M+</span>
              </div>
              <p className="text-sm text-foreground/70">Total Winnings</p>
            </div>
            <div className="glass-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-accent mr-2" />
                <span className="text-2xl font-bold text-accent">10K+</span>
              </div>
              <p className="text-sm text-foreground/70">Active Gamers</p>
            </div>
            <div className="glass-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Play className="h-6 w-6 text-success mr-2" />
                <span className="text-2xl font-bold text-success">24/7</span>
              </div>
              <p className="text-sm text-foreground/70">Live Matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;