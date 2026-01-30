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

  // Update filters when URL search params change
  useEffect(() => {
    setFilters({
      category: searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      search: searchParams.get("search") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, priceRange, sortBy]);

  const fetchProducts = async (retryCount = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.subcategory) params.append("subcategory", filters.subcategory);

      const response = await axios.get(`${API}/products?${params.toString()}`, {
        timeout: 10000, // 10 second timeout
      });
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
      } else {
        setMaxPrice(300000);
        setPriceRange([0, 300000]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      console.error("Error details:", error.response?.data || error.message);
      
      // Retry once if it's a network error
      if (retryCount === 0 && (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Network'))) {
        console.log("Retrying products fetch...");
        setTimeout(() => fetchProducts(1), 1000);
        return;
      }
      
      toast.error(error.response?.data?.detail || "Failed to load products. Please refresh the page.");
      setProducts([]);
      setMaxPrice(300000);
      setPriceRange([0, 300000]);
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
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Category & Metal Filters */}
            <div className="flex flex-wrap gap-4">
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-[#F9F9F7]" data-testid="sort-filter">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right: Price Range Filter */}
            <div className="flex-1 lg:max-w-md">
              <div className="bg-[#F9F9F7] p-4 rounded-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">Price Range</span>
                  <span className="text-sm text-muted-foreground" data-testid="price-range-display">
                    ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={maxPrice}
                  step={1000}
                  className="w-full"
                  data-testid="price-range-slider"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredProducts.length} products</span>
            {(filters.category || filters.subcategory || filters.search) && (
              <button
                onClick={() => {
                  setFilters({ category: "", subcategory: "", search: "" });
                  navigate("/products");
                }}
                className="text-[#D4AF37] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground mb-4">
              {products.length === 0 ? "No products available" : "No products found"}
            </p>
            {products.length === 0 ? (
              <Button
                onClick={() => {
                  fetchProducts();
                }}
                className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full"
                data-testid="retry-button"
              >
                Retry Loading
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setFilters({ category: "", subcategory: "", search: "" });
                  setPriceRange([0, maxPrice]);
                  navigate("/products");
                }}
                className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
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
                  
                  {/* Quick View & Add to Cart buttons on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-white text-[#1A1A1A] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => handleQuickView(product)}
                        data-testid={`quick-view-${product.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Quick View
                      </button>
                      <button
                        className="flex-1 bg-[#D4AF37] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => handleAddToCart(product.id)}
                        data-testid={`add-cart-${product.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
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

        {/* Quick View Modal */}
        <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
          <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
            {quickViewProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-[#1A1A1A]">
                    {quickViewProduct.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-sm">
                    <img
                      src={quickViewProduct.image_url}
                      alt={quickViewProduct.name}
                      className="w-full h-96 object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {quickViewProduct.subcategory} • {quickViewProduct.category}
                    </p>
                    <p className="text-base text-[#1A1A1A]">{quickViewProduct.description}</p>

                    {/* Price Breakdown */}
                    <div className="bg-[#F9F9F7] p-4 rounded-sm space-y-2">
                      <h4 className="font-serif text-[#1A1A1A] mb-3">Price Breakdown</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Metal Price</span>
                        <span className="font-medium">₹{quickViewProduct.metal_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Making Charges</span>
                        <span className="font-medium">₹{quickViewProduct.making_charges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (3%)</span>
                        <span className="font-medium">₹{quickViewProduct.gst.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-[#E5E5E5] pt-2 flex justify-between">
                        <span className="font-serif text-[#1A1A1A]">Total Price</span>
                        <span className="text-xl font-bold text-[#D4AF37]">
                          ₹{quickViewProduct.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weight</p>
                        <p className="font-medium text-[#1A1A1A]">{quickViewProduct.weight}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purity</p>
                        <p className="font-medium text-[#1A1A1A]">{quickViewProduct.purity}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => {
                          handleAddToCart(quickViewProduct.id);
                          setQuickViewProduct(null);
                        }}
                        className="flex-1 bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-6"
                        data-testid="quick-view-add-cart"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => {
                          navigate(`/products/${quickViewProduct.id}`);
                          setQuickViewProduct(null);
                        }}
                        variant="outline"
                        className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-full py-6"
                        data-testid="quick-view-full-details"
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductsPage;