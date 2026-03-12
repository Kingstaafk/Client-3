import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://client-3-b9sm.onrender.com";
const API = `${BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(
        `${API}/cart`,
        { product_id: id, quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Added to cart successfully!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const handleSaveItem = async () => {
    if (!token) {
      toast.error("Please login to save items");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API}/saved-items`,
        { product_id: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Item saved to your collection");
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("Failed to save item");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[#1A1A1A] hover:text-[#D4AF37] transition-colors mb-8"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-sm uppercase tracking-wider font-bold">Back</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-sm shadow-lg mb-4">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-[600px] object-cover"
                data-testid="product-image"
              />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-24 object-cover rounded-sm cursor-pointer hover:opacity-75 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {product.subcategory} • {product.category}
              </p>
              <h1 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] mb-4" data-testid="product-name">
                {product.name}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Price Breakdown */}
            <div className="bg-[#F9F9F7] p-6 rounded-sm space-y-3">
              <h3 className="text-lg font-serif text-[#1A1A1A] mb-4">Price Breakdown</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Metal Price</span>
                <span className="font-medium">₹{product.metal_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Making Charges</span>
                <span className="font-medium">₹{product.making_charges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (3%)</span>
                <span className="font-medium">₹{product.gst.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#E5E5E5] pt-3 flex justify-between">
                <span className="text-lg font-serif text-[#1A1A1A]">Total Price</span>
                <span className="text-2xl font-bold text-[#D4AF37]" data-testid="product-price">
                  ₹{product.total_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-[#1A1A1A] mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weight</p>
                  <p className="font-medium text-[#1A1A1A]">{product.weight}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purity</p>
                  <p className="font-medium text-[#1A1A1A]">{product.purity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p className="font-medium text-[#1A1A1A] capitalize">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Metal</p>
                  <p className="font-medium text-[#1A1A1A] capitalize">{product.subcategory}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleBuyNow}
                disabled={!product.in_stock}
                className="flex-1 bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
                data-testid="buy-now-button"
              >
                {product.in_stock ? "Buy Now" : "Out of Stock"}
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock || addingToCart}
                variant="outline"
                className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-full py-6 transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                onClick={handleSaveItem}
                variant="outline"
                size="icon"
                className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-full h-12 w-12 transition-all duration-300"
                data-testid="save-button"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="border-t border-[#E5E5E5] pt-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Certified</p>
                <p className="font-medium text-[#1A1A1A]">100% Hallmark</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Exchange</p>
                <p className="font-medium text-[#1A1A1A]">Lifetime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
