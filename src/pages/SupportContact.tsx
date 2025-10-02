import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const SupportContact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Contact Support
                </span>
              </h1>
              <p className="text-foreground/70 max-w-3xl mx-auto">
                Send us a message and our team will get back to you.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name</label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" className="glass" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className="glass" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Brief subject" className="glass" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={6} placeholder="Describe your issue..." className="glass resize-none" />
                </div>
                <Button type="button" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Send Message
                </Button>
              </form>

              <div className="prose prose-invert max-w-none mt-12">
                <h2 className="text-2xl font-bold">Other Channels</h2>
                <ul className="list-disc pl-6 text-foreground/80">
                  <li>Email: tacktixedgedispute@gmail.com</li>
                  <li>WhatsApp: 08141826128</li>
                  <li>Discord: discord.gg/3ZRHggav</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupportContact;
