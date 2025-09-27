import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    platform: [
      { name: "How It Works", href: "#how-it-works" },
      { name: "Supported Games", href: "#games" },
      { name: "Tournaments", href: "#tournaments" },
      { name: "Leaderboards", href: "#leaderboards" },
    ],
    support: [
      { name: "FAQ", href: "/support/faq" },
      { name: "Contact Support", href: "/support/contact" },
      { name: "Dispute Resolution", href: "/support/disputes" },
      { name: "Community Guidelines", href: "/support/guidelines" },
    ],
    legal: [
      { name: "Terms of Service", href: "/legal/terms" },
      { name: "Privacy Policy", href: "/legal/privacy" },
      { name: "Responsible Gaming", href: "/legal/responsible" },
      { name: "KYC Policy", href: "/legal/kyc" },
    ],
    social: [
      { name: "Discord", href: "#", icon: "💬" },
      { name: "WhatsApp", href: "#", icon: "📱" },
      { name: "Telegram", href: "#", icon: "⚡" },
      { name: "TikTok", href: "#", icon: "🎵" },
    ]
  };

  const paymentPartners = [
    "Flutterwave", "Paystack", "GTBank", "Access Bank", "First Bank", "UBA", "Zenith Bank"
  ];

  return (
    <footer className="bg-background/80 backdrop-blur-lg border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                  TacktixEdge
                </h3>
                <p className="text-foreground/70 mb-4 leading-relaxed">
                  Nigeria's premier competitive gaming platform. Where skill meets opportunity, 
                  and every game is a chance to win real money.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    🎮 10K+ Active Players
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    💰 ₦50M+ Paid Out
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ⚡ 24/7 Support
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@tacktixedge.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-accent" />
                  <span>WhatsApp: +234 900 123 4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-success" />
                  <span>Available 24/7 for support</span>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
              <ul className="space-y-2 text-sm">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-primary transition-colors link-glow"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-sm">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-primary transition-colors link-glow"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Social */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm mb-6">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-primary transition-colors link-glow"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Social Links */}
              <h4 className="font-semibold mb-4 text-foreground">Community</h4>
              <div className="flex flex-wrap gap-2">
                {footerLinks.social.map((social) => (
                  <Button
                    key={social.name}
                    size="sm"
                    variant="outline"
                    className="glass-button h-8 px-3"
                    asChild
                  >
                    <a href={social.href}>
                      <span className="mr-1">{social.icon}</span>
                      <span className="text-xs">{social.name}</span>
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Partners */}
        <div className="py-8 border-t border-border/30">
          <div className="text-center mb-6">
            <h4 className="font-semibold mb-4 text-foreground">Trusted Payment Partners</h4>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {paymentPartners.map((partner) => (
                <div key={partner} className="glass rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-foreground/70">
                    {partner}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-foreground/60">
              © 2024 TacktixEdge. All rights reserved. 
              <span className="ml-2">Made with ❤️ for Nigerian gamers.</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <Badge variant="outline" className="text-xs">
                🔒 SSL Secured
              </Badge>
              <Badge variant="outline" className="text-xs">
                🇳🇬 Nigerian Owned
              </Badge>
              <Badge variant="outline" className="text-xs">
                ✅ Fully Licensed
              </Badge>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-xs text-foreground/50 text-center leading-relaxed">
              <strong>Disclaimer:</strong> TacktixEdge operates as a skill-based gaming platform. 
              All games are based on player skill and strategy, not chance. 
              Players must be 18+ and play responsibly. 
              We promote responsible gaming and provide tools to manage your gaming activity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;