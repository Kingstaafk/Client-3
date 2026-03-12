import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errorMessage";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.full_name);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error(getApiErrorMessage(error, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4 py-12" data-testid="signup-page">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 md:p-12 rounded-sm shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-[#1A1A1A] mb-2" data-testid="signup-title">Create Account</h1>
            <p className="text-muted-foreground">Join our exclusive community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-[#1A1A1A] mb-2 block">
                Full Name
              </Label>
              <Input
                id="full_name"
                type="text"
                required
                className="bg-[#F9F9F7] border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                data-testid="fullname-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-[#1A1A1A] mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                className="bg-[#F9F9F7] border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#1A1A1A] mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                className="bg-[#F9F9F7] border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="password-input"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#1A1A1A] mb-2 block">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                className="bg-[#F9F9F7] border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                data-testid="confirm-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
              data-testid="signup-submit-button"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-[#D4AF37] hover:underline font-medium" data-testid="login-link">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;