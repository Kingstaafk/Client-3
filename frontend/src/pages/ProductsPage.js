import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Heart, Eye, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 300000]);
  const [maxPrice, setMaxPrice] = useState(300000);
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    search: searchParams.get("search") || "",
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, priceRange, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.subcategory) params.append("subcategory", filters.subcategory);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      let fetchedProducts = response.data;

      // Client-side search filtering
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        fetchedProducts = fetchedProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.subcategory.toLowerCase().includes(searchLower)
        );
      }

      setProducts(fetchedProducts);
      
      // Calculate max price
      if (fetchedProducts.length > 0) {
        const max = Math.max(...fetchedProducts.map(p => p.total_price));
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = products.filter(product => 
      product.total_price >= priceRange[0] && product.total_price <= priceRange[1]
    );

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.total_price - b.total_price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.total_price - a.total_price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleSaveItem = async (productId) => {
    if (!token) {
      toast.error("Please login to save items");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API}/saved-items`,
        { product_id: productId },
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

  const handleAddToCart = async (productId) => {
    if (!token) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API}/cart`,
        { product_id: productId, quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Added to cart successfully!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  return (
    <div className="min-h-screen bg-white" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-4" data-testid="products-title">
            Our Collection
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {filters.search 
              ? `Search results for "${filters.search}"`
              : "Explore our exquisite range of handcrafted jewellery"
            }
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value })}
          >
            <SelectTrigger className="w-[180px] bg-[#F9F9F7]" data-testid="category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value=" ">All Categories</SelectItem>
              <SelectItem value="ring">Rings</SelectItem>
              <SelectItem value="necklace">Necklaces</SelectItem>
              <SelectItem value="earrings">Earrings</SelectItem>
              <SelectItem value="bracelet">Bracelets</SelectItem>
              <SelectItem value="bangles">Bangles</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.subcategory}
            onValueChange={(value) => setFilters({ ...filters, subcategory: value })}
          >
            <SelectTrigger className="w-[180px] bg-[#F9F9F7]" data-testid="subcategory-filter">
              <SelectValue placeholder="Metal" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value=" ">All Metals</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card cursor-pointer"
                data-testid={`product-card-${product.id}`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    onClick={() => navigate(`/products/${product.id}`)}
                  />
                  <button
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all duration-200"
                    onClick={() => handleSaveItem(product.id)}
                    data-testid={`save-button-${product.id}`}
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white px-6 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                    onClick={() => navigate(`/products/${product.id}`)}
                    data-testid={`quick-view-${product.id}`}
                  >
                    Quick View
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {product.subcategory} • {product.category}
                  </p>
                  <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D4AF37]">₹{product.total_price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{product.purity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;