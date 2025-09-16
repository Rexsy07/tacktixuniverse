import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageCircle, Phone, Mail, Search, HelpCircle, 
  Shield, CreditCard, Gamepad2, AlertTriangle, 
  Clock, CheckCircle, ExternalLink
} from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Get instant help via WhatsApp",
      contact: "+234 809 123 4567",
      availability: "24/7",
      color: "text-success",
      bgColor: "bg-success/20"
    },
    {
      icon: MessageCircle,
      title: "Discord Community",
      description: "Join our gaming community",
      contact: "discord.gg/tacktixedge",
      availability: "24/7",
      color: "text-accent",
      bgColor: "bg-accent/20"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Detailed support via email",
      contact: "support@tacktixedge.com",
      availability: "24-48 hours",
      color: "text-primary",
      bgColor: "bg-primary/20"
    }
  ];

  const faqCategories = [
    { id: "all", name: "All Categories", icon: HelpCircle },
    { id: "account", name: "Account & Profile", icon: Shield },
    { id: "payments", name: "Deposits & Withdrawals", icon: CreditCard },
    { id: "gaming", name: "Gaming & Matches", icon: Gamepad2 },
    { id: "disputes", name: "Disputes & Issues", icon: AlertTriangle }
  ];

  const faqs = [
    {
      category: "account",
      question: "How do I create a TacktixEdge account?",
      answer: "Click 'Sign Up' on our homepage, enter your username, email/phone, and password. Your username must be unique as it's used for payment verification. Once registered, complete your profile with gamer tags for each game you want to play."
    },
    {
      category: "account",
      question: "Can I change my username after registration?",
      answer: "Usernames cannot be changed after registration as they're linked to your payment verification system. Choose carefully during signup. You can update your display name and gamer tags anytime in your profile settings."
    },
    {
      category: "payments",
      question: "How do deposits work on TacktixEdge?",
      answer: "Deposits are processed manually for security. Click 'Deposit', get our bank details and your unique reference code, transfer money from your bank app including your username in the narration, and our team verifies and credits your wallet within 30 minutes during business hours."
    },
    {
      category: "payments",
      question: "What's the minimum and maximum deposit amount?",
      answer: "Minimum deposit is ₦500, maximum is ₦50,000 per transaction. For larger deposits, contact support. There are no deposit fees from our side, but your bank may charge standard transfer fees."
    },
    {
      category: "payments",
      question: "How long do withdrawals take?",
      answer: "Withdrawals are processed within 24 hours. Enter your bank details in the withdrawal section, our team verifies your identity and account, then sends money directly to your Nigerian bank account. A small bank transfer fee (₦50-₦100) applies."
    },
    {
      category: "payments",
      question: "Which banks are supported for withdrawals?",
      answer: "All major Nigerian banks are supported: GTBank, Access, First Bank, UBA, Zenith, Ecobank, FCMB, Sterling, Union Bank, and more. Fintech wallets like Opay, Palmpay, and Kuda are also supported."
    },
    {
      category: "gaming",
      question: "What games can I play on TacktixEdge?",
      answer: "We support Nigeria's most popular mobile games: Call of Duty Mobile (CODM), PUBG Mobile, Free Fire, EA FC Mobile, and PES Mobile. Each game has multiple modes like Battle Royale, Team Deathmatch, 1v1 duels, and more."
    },
    {
      category: "gaming",
      question: "How do I create a challenge?",
      answer: "Go to your game's page, click 'Create Challenge', choose game mode, set stake amount (₦200-₦10,000), define rules (maps, weapon restrictions, etc.), and publish. Your stake is locked in escrow until the match is resolved."
    },
    {
      category: "gaming",
      question: "What proof do I need to upload after a match?",
      answer: "Take clear screenshots of final scores, leaderboards, or match results. Both players must upload evidence. Include lobby codes, timestamps, and any other relevant proof. Blurry or incomplete screenshots may lead to disputes."
    },
    {
      category: "gaming",
      question: "Can I play with friends or create team matches?",
      answer: "Yes! You can create team challenges (2v2, 5v5, squad battles) and invite specific players. Team matches require all team members to have sufficient wallet balance for their portion of the stake."
    },
    {
      category: "disputes",
      question: "What happens if there's a dispute about match results?",
      answer: "Our admin team reviews disputes within 2 hours during peak times (24 hours maximum). We examine all submitted evidence, check game rules compliance, and make fair decisions. Both players receive notifications about the resolution."
    },
    {
      category: "disputes",
      question: "What if my opponent doesn't upload proof?",
      answer: "If an opponent fails to upload proof within 2 hours of match completion, you automatically win by default. The escrow releases your stake plus their stake (minus platform fee) to your wallet."
    },
    {
      category: "disputes",
      question: "How do you prevent cheating and emulator use?",
      answer: "We have strict anti-cheat policies. Players must use mobile devices only (no emulators), provide device screenshots when requested, and follow fair play guidelines. Violators face permanent bans and forfeit any pending winnings."
    },
    {
      category: "gaming",
      question: "Are there any fees for playing matches?",
      answer: "We charge a 5% platform fee on winnings only. There are no fees for creating challenges, joining matches, or depositing money. This fee helps maintain our platform, security, and customer support."
    },
    {
      category: "account",
      question: "Is TacktixEdge legal in Nigeria?",
      answer: "Yes, TacktixEdge operates as a skill-based gaming platform, not gambling. Players compete based on gaming skills, not chance. We comply with Nigerian regulations and encourage responsible gaming with spending limits and time controls."
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Support Center
                </span>
              </h1>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                Get help with deposits, withdrawals, gaming disputes, and everything TacktixEdge. 
                We're here to ensure your gaming experience is smooth and rewarding.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <Input
                  type="text"
                  placeholder="Search for help topics, payment issues, game rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-card border-primary/20 text-lg py-6"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Get Instant Help</h2>
              <p className="text-foreground/70">
                Multiple ways to reach our support team for quick assistance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <Card key={index} className="glass-card text-center hover:glow-primary transition-all duration-300">
                    <div className="p-6">
                      <div className={`w-16 h-16 rounded-full ${method.bgColor} flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`h-8 w-8 ${method.color}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                      <p className="text-foreground/70 mb-4">{method.description}</p>
                      <div className="space-y-2">
                        <div className="font-mono text-sm bg-muted/50 rounded p-2">
                          {method.contact}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Response: {method.availability}
                        </Badge>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Contact Now
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-foreground/70">
                Find answers to common questions about TacktixEdge
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {faqCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="glass-button"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="glass-card border-0">
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-foreground/80 leading-relaxed">{faq.answer}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No matching questions found</h3>
                  <p className="text-foreground/70 mb-6">
                    Try adjusting your search terms or browse different categories
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="glass-button"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <Card className="glass-card">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
                    <p className="text-foreground/70">
                      Can't find what you're looking for? Send us a message and we'll get back to you.
                    </p>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Name</label>
                        <Input placeholder="Enter your full name" className="glass" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email Address</label>
                        <Input type="email" placeholder="your@email.com" className="glass" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">TacktixEdge Username</label>
                      <Input placeholder="Your TacktixEdge username (if applicable)" className="glass" />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Issue Category</label>
                      <select className="w-full p-3 rounded-lg glass border border-border bg-background">
                        <option>Select category...</option>
                        <option>Account Issues</option>
                        <option>Deposit Problems</option>
                        <option>Withdrawal Delays</option>
                        <option>Game Disputes</option>
                        <option>Technical Problems</option>
                        <option>General Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <Textarea 
                        placeholder="Describe your issue in detail. Include transaction IDs, match details, or any other relevant information..."
                        rows={6}
                        className="glass resize-none"
                      />
                    </div>

                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="glass-card border-amber-500/20 max-w-4xl mx-auto">
              <div className="p-8">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-amber-500">Emergency Support</h3>
                    <p className="text-foreground/80 mb-4">
                      For urgent issues like unauthorized transactions, account security concerns, or time-sensitive disputes, 
                      contact us immediately via WhatsApp at <span className="font-mono font-semibold">+234 809 123 4567</span>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Emergency Situations Include:</h4>
                        <ul className="text-foreground/70 space-y-1">
                          <li>• Unauthorized account access</li>
                          <li>• Suspicious transactions</li>
                          <li>• Account temporarily locked</li>
                          <li>• Match disputes over ₦5,000</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Response Times:</h4>
                        <ul className="text-foreground/70 space-y-1">
                          <li>• WhatsApp: Within 30 minutes</li>
                          <li>• Discord: Within 1 hour</li>
                          <li>• Email: Within 4 hours</li>
                          <li>• Emergency: Immediate</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Support;