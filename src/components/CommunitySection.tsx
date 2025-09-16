import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageCircle, Users, ExternalLink, Quote } from "lucide-react";

const CommunitySection = () => {
  const testimonials = [
    {
      id: 1,
      name: "ChineduGamer",
      location: "Lagos",
      game: "CODM",
      rating: 5,
      earnings: "₦45,000",
      text: "Been playing on TacktixEdge for 3 months now. The withdrawal process is smooth and I've never had issues with disputes. Great platform!",
      verified: true
    },
    {
      id: 2,
      name: "AishaQueen",
      location: "Abuja",
      game: "Free Fire",
      rating: 5,
      earnings: "₦32,500",
      text: "As a female gamer, I was skeptical at first. But the community here is respectful and the admin team is very professional. Highly recommend!",
      verified: true
    },
    {
      id: 3,
      name: "EmekaMessi",
      location: "Port Harcourt",
      game: "PES",
      rating: 5,
      earnings: "₦67,800",
      text: "The tournament system is amazing! Just won the PES monthly cup. Prize payout was instant. TacktixEdge is legit!",
      verified: true
    },
    {
      id: 4,
      name: "FatimaSniper",
      location: "Kano",
      game: "PUBG",
      rating: 4,
      earnings: "₦28,900",
      text: "Love the fair play system. Had one dispute and admin resolved it within 2 hours. Customer service is top-notch.",
      verified: true
    }
  ];

  const communityStats = [
    {
      icon: Users,
      value: "12,547",
      label: "Active Gamers",
      description: "Across all games"
    },
    {
      icon: MessageCircle,
      value: "98.5%",
      label: "Satisfaction Rate",
      description: "From player reviews"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "Average Rating",
      description: "Community feedback"
    }
  ];

  const socialChannels = [
    {
      platform: "Discord",
      icon: "💬",
      members: "3.2K",
      description: "Join live discussions, find teammates, get support",
      cta: "Join Server"
    },
    {
      platform: "WhatsApp",
      icon: "📱",
      members: "1.8K",
      description: "Quick support, updates, and community chat",
      cta: "Join Group"
    },
    {
      platform: "Telegram",
      icon: "⚡",
      members: "2.1K",
      description: "Tournament announcements and live match updates",
      cta: "Follow Channel"
    },
    {
      platform: "TikTok",
      icon: "🎵",
      members: "5.4K",
      description: "Gaming highlights, tutorials, and community content",
      cta: "Follow Us"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Community & Testimonials
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Join thousands of Nigerian gamers who trust TacktixEdge. See what our community has to say about their experiences.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {communityStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card text-center">
                <div className="p-6">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-foreground mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {stat.description}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            What Our Players Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="glass-card game-card">
                <div className="p-6">
                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-foreground/80 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold">
                          {testimonial.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{testimonial.name}</span>
                          {testimonial.verified && (
                            <Badge variant="outline" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {testimonial.location} • {testimonial.game} Player
                        </div>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-success">
                        {testimonial.earnings}
                      </div>
                      <div className="text-xs text-foreground/50">
                        Total Won
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Channels */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Join Our Community
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialChannels.map((channel, index) => (
              <Card key={index} className="glass-card text-center game-card">
                <div className="p-6">
                  <div className="text-4xl mb-4">{channel.icon}</div>
                  <h4 className="font-bold mb-2">{channel.platform}</h4>
                  <div className="text-sm text-primary font-semibold mb-3">
                    {channel.members} members
                  </div>
                  <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
                    {channel.description}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {channel.cta}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <Card className="glass-card">
          <div className="p-8 text-center">
            <h3 className="text-xl font-bold mb-6">Community Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-2xl mb-3">🤝</div>
                <h4 className="font-semibold mb-2">Respect & Fair Play</h4>
                <p className="text-foreground/70">
                  We maintain a respectful gaming environment. Toxic behavior results in permanent bans.
                </p>
              </div>
              <div>
                <div className="text-2xl mb-3">🚫</div>
                <h4 className="font-semibold mb-2">No Cheating Tolerated</h4>
                <p className="text-foreground/70">
                  Use of hacks, emulators, or any unfair advantage leads to immediate account termination.
                </p>
              </div>
              <div>
                <div className="text-2xl mb-3">⚖️</div>
                <h4 className="font-semibold mb-2">Fair Dispute Resolution</h4>
                <p className="text-foreground/70">
                  All disputes are reviewed fairly by trained admins. Evidence-based decisions only.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CommunitySection;