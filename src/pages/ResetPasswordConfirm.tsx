import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, AlertCircle, Gamepad2 } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const ResetPasswordConfirm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
    general: ""
  });
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Check if we have the hash fragment from the reset email
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) {
      setErrors(prev => ({
        ...prev,
        general: "Invalid or expired password reset link. Please request a new one."
      }));
    }
  }, []);

  // Password validation function
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({
      password: "",
      confirmPassword: "",
      general: ""
    });
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
        variant: "default"
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (err: any) {
      console.error("Password update error:", err);
      setErrors(prev => ({
        ...prev,
        general: err.message || "Failed to reset password. Please try again."
      }));
      toast({
        title: "Error",
        description: err.message || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
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
                Create a new secure password for your account
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                {!success ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                      <div className="flex items-center text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.general}
                      </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) {
                              setErrors(prev => ({ ...prev, password: "" }));
                            }
                          }}
                          className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <div className="flex items-center text-destructive text-xs mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.password}
                        </div>
                      )}
                      <p className="text-xs text-foreground/70">
                        Password must be at least 8 characters with uppercase, number, and special character
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) {
                              setErrors(prev => ({ ...prev, confirmPassword: "" }));
                            }
                          }}
                          className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="flex items-center text-destructive text-xs mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                      disabled={loading}
                    >
                      {loading ? "Resetting Password..." : "Reset Password"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Password Reset Successful</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPasswordConfirm;