import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Gamepad2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      // Use production URL when deployed, otherwise use current origin
      const isProd = window.location.hostname === 'rexsy07.github.io';
      const baseUrl = isProd 
        ? 'https://Rexsy07.github.io/tacktixuniverse'
        : window.location.origin;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: baseUrl + "/reset-password-confirm",
      });
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to send reset instructions. Please try again.",
        variant: "destructive"
      });
      setError(err.message || "Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent mb-4">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Reset Password
                </span>
              </h1>
              <p className="text-foreground/70">
                Enter your email to receive reset instructions
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className={`pl-10 ${error ? "border-destructive" : ""}`}
                          required
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <div className="flex items-center text-destructive text-xs mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Check Your Email</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      We've sent password reset instructions to{" "}
                      <span className="font-semibold text-foreground">{email}</span>
                    </p>
                    <p className="text-sm text-foreground/60">
                      Didn't receive the email? Check your spam folder or{" "}
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-primary hover:underline"
                      >
                        try again
                      </button>
                    </p>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;