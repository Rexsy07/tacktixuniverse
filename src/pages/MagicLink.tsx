import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Gamepad2, Zap, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const MagicLink = () => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleMagicLinkAuth = async () => {
      try {
        // Check if we have the hash fragment from the magic link email
        const hash = window.location.hash;
        
        if (!hash || !hash.includes("type=magiclink")) {
          setError("Invalid or expired magic link. Please request a new one.");
          setAuthStatus('error');
          return;
        }

        // Parse the hash to get the tokens
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          setError("Missing authentication tokens. Please request a new magic link.");
          setAuthStatus('error');
          return;
        }

        // Set the session with the tokens from the URL
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          throw sessionError;
        }

        if (data.user) {
          setAuthStatus('success');
          toast({
            title: "Login Successful!",
            description: "Welcome back to TackTix Arena! You've been logged in via magic link.",
            variant: "default"
          });

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        } else {
          throw new Error("Failed to authenticate with magic link");
        }
      } catch (err: any) {
        console.error("Magic link authentication error:", err);
        setError(err.message || "Failed to log in with magic link. Please try again.");
        setAuthStatus('error');
        toast({
          title: "Authentication Failed",
          description: err.message || "Failed to log in with magic link. Please try again.",
          variant: "destructive"
        });
      }
    };

    handleMagicLinkAuth();
  }, [navigate]);

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
                  Magic Link Login
                </span>
              </h1>
              <p className="text-foreground/70">
                Authenticating your TackTix Arena account
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                {authStatus === 'loading' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                      <Zap className="h-8 w-8 text-primary animate-bounce" />
                    </div>
                    <h3 className="text-lg font-semibold">Logging You In...</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Please wait while we authenticate your magic link.
                    </p>
                  </div>
                )}

                {authStatus === 'success' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Login Successful!</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Welcome back to TackTix Arena! You've been successfully logged in.
                    </p>
                    <p className="text-sm text-foreground/60">
                      You will be redirected to your profile in a moment...
                    </p>
                    <Button 
                      onClick={() => navigate("/profile")}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                    >
                      Go to Profile
                    </Button>
                  </div>
                )}

                {authStatus === 'error' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">Authentication Failed</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      {error}
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="w-full"
                      >
                        Try Again
                      </Button>
                      <p className="text-sm text-foreground/60">
                        Need a new magic link?{" "}
                        <Link 
                          to="/login" 
                          className="text-primary hover:underline"
                        >
                          Go to Login
                        </Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-primary hover:underline"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MagicLink;