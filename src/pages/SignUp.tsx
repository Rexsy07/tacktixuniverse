import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, User, Mail, Lock, Gamepad2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: ""
  });

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Validate password as user types
    if (name === "password") {
      validatePassword(value);
    }
    
    // Check password match as user types in confirm field
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };
  
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one uppercase letter" }));
      return false;
    }
    
    if (!/[0-9]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one number" }));
      return false;
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one special character" }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, password: "" }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset all errors
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: ""
    });
    
    // Validate form
    let hasErrors = false;
    
    if (!formData.agreeTerms) {
      setErrors(prev => ({ ...prev, agreeTerms: "You must agree to the terms and conditions" }));
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      hasErrors = true;
    }
    
    if (!validatePassword(formData.password)) {
      hasErrors = true;
    }
    
    if (formData.username.length < 3) {
      setErrors(prev => ({ ...prev, username: "Username must be at least 3 characters" }));
      hasErrors = true;
    }
    
    if (!formData.email.includes("@")) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      hasErrors = true;
    }
    
    if (hasErrors) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setLoading(true);
    
    const { error } = await signUp(
      formData.email, 
      formData.password, 
      formData.username,
      formData.fullName
    );
    
    setLoading(false);
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
                  Join TacktixEdge
                </span>
              </h1>
              <p className="text-foreground/70">
                Start competing and earning with your gaming skills
              </p>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.username && (
                      <div className="flex items-center text-destructive text-xs mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.username}
                      </div>
                    )}
                    <p className="text-xs text-foreground/60">
                      This will be used for payments and challenges
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center text-destructive text-xs mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+234 xxx xxx xxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleInputChange}
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
                    <p className="text-xs text-foreground/60">
                      Password must be at least 8 characters with uppercase, number, and special character
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                        required
                      />
                    </div>
                    {errors.confirmPassword && (
                      <div className="flex items-center text-destructive text-xs mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, agreeTerms: checked as boolean }));
                          if (checked) {
                            setErrors(prev => ({ ...prev, agreeTerms: "" }));
                          }
                        }}
                        className={errors.agreeTerms ? "border-destructive" : ""}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeTerms && (
                      <div className="flex items-center text-destructive text-xs mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.agreeTerms}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                    disabled={!formData.agreeTerms || loading || formData.password !== formData.confirmPassword}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-foreground/70">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-semibold">
                      Sign In
                    </Link>
                  </p>
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

export default SignUp;