import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle, Gamepad2, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Reauthentication = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const redirectTo = searchParams.get('redirect_to') || '/profile';
  const operation = searchParams.get('operation') || 'security verification';

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!token || token.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, you would verify the token against your backend
      // For now, we'll simulate the verification process
      
      // This is where you would make an API call to verify the token
      // Example: const { data, error } = await supabase.rpc('verify_reauthentication_token', { token });
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll accept any 6-digit code
      if (!/^\d{6}$/.test(token)) {
        throw new Error("Invalid verification code format");
      }
      
      setSuccess(true);
      toast({
        title: "Verification Successful",
        description: "You have been successfully reauthenticated.",
        variant: "default"
      });

      // Redirect after success
      setTimeout(() => {
        navigate(redirectTo);
      }, 2000);
      
    } catch (err: any) {
      console.error("Reauthentication error:", err);
      setError(err.message || "Invalid verification code. Please try again.");
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // In a real implementation, you would trigger sending a new reauthentication code
      // Example: await supabase.rpc('send_reauthentication_code', { email: user.email });
      
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Resend code error:", err);
      toast({
        title: "Error",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

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
                  Security Verification
                </span>
              </h1>
              <p className="text-foreground/70">
                Enter the verification code sent to your email
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                {!success ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Verify Your Identity</h3>
                      <p className="text-sm text-foreground/70 mt-2">
                        To proceed with <strong>{operation}</strong>, please enter the 6-digit code sent to{" "}
                        <span className="font-medium">{user?.email}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token">Verification Code</Label>
                      <Input
                        id="token"
                        type="text"
                        placeholder="000000"
                        value={token}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setToken(value);
                          setError("");
                        }}
                        className={`text-center text-xl font-mono tracking-widest ${error ? "border-destructive" : ""}`}
                        maxLength={6}
                        required
                      />
                      <p className="text-xs text-foreground/60 text-center">
                        Enter the 6-digit code from your email
                      </p>
                    </div>
                    
                    {error && (
                      <div className="flex items-center text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                      disabled={loading || token.length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </Button>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-foreground/60">
                        Didn't receive the code?
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-primary hover:underline p-0 h-auto"
                      >
                        Resend Code
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Verification Successful!</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Your identity has been verified. You can now proceed with your requested operation.
                    </p>
                    <p className="text-sm text-foreground/60">
                      Redirecting you now...
                    </p>
                    <Button 
                      onClick={() => navigate(redirectTo)}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="mt-6 text-center space-y-2">
              <Link 
                to={redirectTo} 
                className="text-primary hover:underline block"
              >
                Cancel and go back
              </Link>
              <p className="text-xs text-foreground/60">
                This verification helps keep your account secure
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reauthentication;