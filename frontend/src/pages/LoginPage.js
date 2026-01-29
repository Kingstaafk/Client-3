import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4 py-12" data-testid="login-page">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 md:p-12 rounded-sm shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-[#1A1A1A] mb-2" data-testid="login-title">Welcome Back</h1>
            <p className="text-muted-foreground">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
              data-testid="login-submit-button"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#D4AF37] hover:underline font-medium" data-testid="signup-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;