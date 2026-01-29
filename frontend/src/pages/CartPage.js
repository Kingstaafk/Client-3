import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token]);

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

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await axios.put(
        `${API}/cart/${itemId}?quantity=${newQuantity}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCart();
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Item removed from cart");
      fetchCart();
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.total_price * item.cart_item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-[#1A1A1A] mb-4">Please login to view your cart</h2>
          <Button
            onClick={() => navigate("/login")}
            className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-8 py-3 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-[#1A1A1A] mb-4" data-testid="empty-cart-message">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Explore our collection and add items to your cart</p>
          <Button
            onClick={() => navigate("/products")}
            className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-8 py-3 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
            data-testid="shop-now-button"
          >
            Shop Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-8" data-testid="cart-title">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cart_item.id}
                className="bg-[#F9F9F7] p-6 rounded-sm flex gap-6"
                data-testid={`cart-item-${item.cart_item.id}`}
              >
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-sm"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.product.subcategory} • {item.product.purity}
                  </p>
                  <p className="text-lg font-bold text-[#D4AF37]">
                    ₹{item.product.total_price.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.cart_item.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    data-testid={`remove-item-${item.cart_item.id}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2">
                    <button
                      onClick={() => updateQuantity(item.cart_item.id, item.cart_item.quantity - 1)}
                      className="text-[#D4AF37] hover:text-[#C5A059]"
                      data-testid={`decrease-quantity-${item.cart_item.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-medium w-8 text-center" data-testid={`quantity-${item.cart_item.id}`}>
                      {item.cart_item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cart_item.id, item.cart_item.quantity + 1)}
                      className="text-[#D4AF37] hover:text-[#C5A059]"
                      data-testid={`increase-quantity-${item.cart_item.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#F9F9F7] p-6 rounded-sm sticky top-24">
              <h2 className="text-2xl font-serif text-[#1A1A1A] mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-[#E5E5E5] pt-3 flex justify-between">
                  <span className="text-lg font-serif text-[#1A1A1A]">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]" data-testid="cart-total">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => navigate("/checkout")}
                className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
                data-testid="proceed-to-checkout-button"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;