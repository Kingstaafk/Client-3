import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "cash_on_delivery",
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(response.data);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.total_price * item.cart_item.quantity;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.cart_item.quantity,
          price: item.product.total_price,
        })),
        total_amount: calculateTotal(),
        shipping_address: {
          full_name: formData.full_name,
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        payment_method: formData.payment_method,
      };

      await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order placed successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to place order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-[#1A1A1A] mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate("/products")} className="btn-primary">
            Shop Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="checkout-page">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-8" data-testid="checkout-title">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-[#F9F9F7] p-6 rounded-sm">
                <h2 className="text-2xl font-serif text-[#1A1A1A] mb-6">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name" className="text-[#1A1A1A] mb-2 block">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      data-testid="fullname-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-[#1A1A1A] mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="phone-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line1" className="text-[#1A1A1A] mb-2 block">
                      Address Line 1
                    </Label>
                    <Input
                      id="address_line1"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      data-testid="address1-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line2" className="text-[#1A1A1A] mb-2 block">
                      Address Line 2 (Optional)
                    </Label>
                    <Input
                      id="address_line2"
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      data-testid="address2-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-[#1A1A1A] mb-2 block">
                      City
                    </Label>
                    <Input
                      id="city"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      data-testid="city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-[#1A1A1A] mb-2 block">
                      State
                    </Label>
                    <Input
                      id="state"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      data-testid="state-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="text-[#1A1A1A] mb-2 block">
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      required
                      className="bg-white border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      data-testid="pincode-input"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F9F7] p-6 rounded-sm">
                <h2 className="text-2xl font-serif text-[#1A1A1A] mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={formData.payment_method === "cash_on_delivery"}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-4 h-4 text-[#D4AF37]"
                      data-testid="payment-cod"
                    />
                    <span className="text-[#1A1A1A]">Cash on Delivery</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={formData.payment_method === "online"}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-4 h-4 text-[#D4AF37]"
                      data-testid="payment-online"
                    />
                    <span className="text-[#1A1A1A]">Online Payment</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
                data-testid="place-order-button"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#F9F9F7] p-6 rounded-sm sticky top-24">
              <h2 className="text-2xl font-serif text-[#1A1A1A] mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.cart_item.id} className="flex gap-4">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A]">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.cart_item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[#D4AF37]">
                      ₹{(item.product.total_price * item.cart_item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E5E5E5] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-[#E5E5E5] pt-2 flex justify-between">
                  <span className="text-lg font-serif text-[#1A1A1A]">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]" data-testid="checkout-total">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;