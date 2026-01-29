import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { IndianRupee, Weight, Award } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SellJewelleryPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(null);
  const [formData, setFormData] = useState({
    jewellery_type: "",
    weight: "",
    purity: "",
    description: "",
  });

  const calculateEstimate = () => {
    const baseRates = {
      "22K": 5000,
      "18K": 4000,
      "14K": 3000,
      "24K": 5500,
    };

    if (formData.weight && formData.purity) {
      const rate = baseRates[formData.purity] || 3000;
      const estimate = parseFloat(formData.weight) * rate;
      setEstimatedValue(estimate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(
        `${API}/sell-jewellery`,
        {
          jewellery_type: formData.jewellery_type,
          weight: parseFloat(formData.weight),
          purity: formData.purity,
          description: formData.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Sell request submitted successfully! Our team will contact you soon.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    calculateEstimate();
  }, [formData.weight, formData.purity]);

  return (
    <div className="min-h-screen bg-white" data-testid="sell-jewellery-page">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-4" data-testid="sell-title">
            Sell Your Jewellery
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Get the best value for your precious jewellery with transparent pricing
          </p>
        </div>

        {/* Trust Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#F9F9F7] p-6 rounded-sm text-center">
            <IndianRupee className="h-10 w-10 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">Best Prices</h3>
            <p className="text-sm text-muted-foreground">Fair market value guaranteed</p>
          </div>
          <div className="bg-[#F9F9F7] p-6 rounded-sm text-center">
            <Weight className="h-10 w-10 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">Accurate Weighing</h3>
            <p className="text-sm text-muted-foreground">Digital scales for precision</p>
          </div>
          <div className="bg-[#F9F9F7] p-6 rounded-sm text-center">
            <Award className="h-10 w-10 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">Instant Payment</h3>
            <p className="text-sm text-muted-foreground">Quick and secure transactions</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#F9F9F7] p-8 md:p-12 rounded-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="jewellery_type" className="text-[#1A1A1A] mb-2 block">
                Jewellery Type
              </Label>
              <Select
                value={formData.jewellery_type}
                onValueChange={(value) => setFormData({ ...formData, jewellery_type: value })}
                required
              >
                <SelectTrigger className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm" data-testid="jewellery-type-select">
                  <SelectValue placeholder="Select jewellery type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ring">Ring</SelectItem>
                  <SelectItem value="necklace">Necklace</SelectItem>
                  <SelectItem value="earrings">Earrings</SelectItem>
                  <SelectItem value="bracelet">Bracelet</SelectItem>
                  <SelectItem value="bangles">Bangles</SelectItem>
                  <SelectItem value="chain">Chain</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="weight" className="text-[#1A1A1A] mb-2 block">
                  Weight (in grams)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  required
                  className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  data-testid="weight-input"
                />
              </div>
              <div>
                <Label htmlFor="purity" className="text-[#1A1A1A] mb-2 block">
                  Purity
                </Label>
                <Select
                  value={formData.purity}
                  onValueChange={(value) => setFormData({ ...formData, purity: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm" data-testid="purity-select">
                    <SelectValue placeholder="Select purity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="24K">24K</SelectItem>
                    <SelectItem value="22K">22K</SelectItem>
                    <SelectItem value="18K">18K</SelectItem>
                    <SelectItem value="14K">14K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-[#1A1A1A] mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                rows={4}
                className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm resize-none"
                placeholder="Tell us about your jewellery (condition, design, etc.)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="description-input"
              />
            </div>

            {/* Estimated Value */}
            {estimatedValue && (
              <div className="bg-white p-6 rounded-sm border-2 border-[#D4AF37]">
                <p className="text-sm text-muted-foreground mb-2">Estimated Value</p>
                <p className="text-3xl font-bold text-[#D4AF37]" data-testid="estimated-value">
                  ₹{estimatedValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  *Final value will be determined after inspection by our experts
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
              data-testid="submit-sell-request-button"
            >
              {submitting ? "Submitting..." : "Submit Sell Request"}
            </Button>
          </form>
        </div>

        {/* Process Info */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-serif text-[#1A1A1A] mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-[#D4AF37] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-2">Submit Details</h3>
              <p className="text-sm text-muted-foreground">Fill out the form with your jewellery details</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#D4AF37] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-2">Expert Review</h3>
              <p className="text-sm text-muted-foreground">Our team will review and contact you</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#D4AF37] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-2">Get Paid</h3>
              <p className="text-sm text-muted-foreground">Receive instant payment after verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellJewelleryPage;