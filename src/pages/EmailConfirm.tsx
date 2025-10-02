import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Gamepad2, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const EmailConfirm = () => {
  const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if we have the hash fragment from the confirmation email
        const hash = window.location.hash;
        
        if (!hash || !hash.includes("type=signup")) {
          setError("Invalid or expired confirmation link. Please check your email and try again.");
          setConfirmationStatus('error');
          return;
        }

        // Parse the hash to get the tokens
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          setError("Missing confirmation tokens. Please check your email and try again.");
          setConfirmationStatus('error');
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
          setConfirmationStatus('success');
          toast({
            title: "Email Confirmed!",
            description: "Your account has been successfully verified. Welcome to TacktixEdge!",
            variant: "default"
          });

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate("/profile");
          }, 3000);
        } else {
          throw new Error("Failed to confirm email");
        }
      } catch (err: any) {
        console.error("Email confirmation error:", err);
        setError(err.message || "Failed to confirm your email. Please try again.");
        setConfirmationStatus('error');
        toast({
          title: "Confirmation Failed",
          description: err.message || "Failed to confirm your email. Please try again.",
          variant: "destructive"
        });
      }
    };

    handleEmailConfirmation();
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
                  Email Confirmation
                </span>
              </h1>
              <p className="text-foreground/70">
                Verifying your TacktixEdge account
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                {confirmationStatus === 'loading' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Confirming Your Email...</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Please wait while we verify your account.
                    </p>
                  </div>
                )}

                {confirmationStatus === 'success' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Email Confirmed Successfully!</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Welcome to TacktixEdge! Your account has been verified and you're now ready to start gaming.
                    </p>
                    <p className="text-sm text-foreground/60">
                      You will be redirected to your profile in a few seconds...
                    </p>
                    <Button 
                      onClick={() => navigate("/profile")}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                    >
                      Go to Profile
                    </Button>
                  </div>
                )}

                {confirmationStatus === 'error' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">Confirmation Failed</h3>
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
                        Need help?{" "}
                        <Link 
                          to="/support/contact" 
                          className="text-primary hover:underline"
                        >
                          Contact Support
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

export default EmailConfirm;