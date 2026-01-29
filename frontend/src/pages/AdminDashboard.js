import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, Users, ShoppingBag, DollarSign, Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellRequests, setSellRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    weight: "",
    purity: "",
    metal_price: "",
    making_charges: "",
    image_url: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes, ordersRes, sellRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sell-jewellery`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setSellRequests(sellRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const metalPrice = parseFloat(productForm.metal_price);
    const makingCharges = parseFloat(productForm.making_charges);
    const gst = (metalPrice + makingCharges) * 0.03;
    const totalPrice = metalPrice + makingCharges + gst;

    try {
      await axios.post(
        `${API}/products`,
        {
          ...productForm,
          weight: parseFloat(productForm.weight),
          metal_price: metalPrice,
          making_charges: makingCharges,
          gst: gst,
          total_price: totalPrice,
          images: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Product added successfully!");
      setDialogOpen(false);
      setProductForm({
        name: "",
        category: "",
        subcategory: "",
        description: "",
        weight: "",
        purity: "",
        metal_price: "",
        making_charges: "",
        image_url: "",
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error("Failed to add product");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/status?status=${newStatus}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Order status updated");
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleUpdateSellRequest = async (requestId, status, estimatedValue) => {
    try {
      const params = new URLSearchParams({ status });
      if (estimatedValue) {
        params.append("estimated_value", estimatedValue);
      }

      await axios.put(`${API}/sell-jewellery/${requestId}?${params.toString()}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Sell request updated");
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update sell request:", error);
      toast.error("Failed to update sell request");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${API}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted");
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-2" data-testid="admin-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your jewellery store</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full" data-testid="add-product-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-[#1A1A1A]">Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    data-testid="product-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                      required
                    >
                      <SelectTrigger data-testid="product-category-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="ring">Ring</SelectItem>
                        <SelectItem value="necklace">Necklace</SelectItem>
                        <SelectItem value="earrings">Earrings</SelectItem>
                        <SelectItem value="bracelet">Bracelet</SelectItem>
                        <SelectItem value="bangles">Bangles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory">Metal Type</Label>
                    <Select
                      value={productForm.subcategory}
                      onValueChange={(value) => setProductForm({ ...productForm, subcategory: value })}
                      required
                    >
                      <SelectTrigger data-testid="product-subcategory-select">
                        <SelectValue placeholder="Select metal" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    data-testid="product-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (grams)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      required
                      value={productForm.weight}
                      onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                      data-testid="product-weight-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purity">Purity</Label>
                    <Select
                      value={productForm.purity}
                      onValueChange={(value) => setProductForm({ ...productForm, purity: value })}
                      required
                    >
                      <SelectTrigger data-testid="product-purity-select">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metal_price">Metal Price (₹)</Label>
                    <Input
                      id="metal_price"
                      type="number"
                      step="0.01"
                      required
                      value={productForm.metal_price}
                      onChange={(e) => setProductForm({ ...productForm, metal_price: e.target.value })}
                      data-testid="product-metal-price-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="making_charges">Making Charges (₹)</Label>
                    <Input
                      id="making_charges"
                      type="number"
                      step="0.01"
                      required
                      value={productForm.making_charges}
                      onChange={(e) => setProductForm({ ...productForm, making_charges: e.target.value })}
                      data-testid="product-making-charges-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    required
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    data-testid="product-image-url-input"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary" data-testid="submit-product-button">
                  Add Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#F9F9F7] p-6 rounded-sm">
              <ShoppingBag className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-products">{stats.total_products}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
            <div className="bg-[#F9F9F7] p-6 rounded-sm">
              <Package className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-orders-stat">{stats.total_orders}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
            <div className="bg-[#F9F9F7] p-6 rounded-sm">
              <Users className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-users">{stats.total_users}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="bg-[#F9F9F7] p-6 rounded-sm">
              <DollarSign className="h-8 w-8 text-[#D4AF37] mb-3" />
              <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="pending-sell-requests">{stats.pending_sell_requests}</p>
              <p className="text-sm text-muted-foreground">Pending Sell Requests</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-[#F9F9F7]">
            <TabsTrigger value="products" data-testid="products-tab">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab-admin">Orders</TabsTrigger>
            <TabsTrigger value="sell" data-testid="sell-tab-admin">Sell Requests</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-[#F9F9F7] rounded-sm overflow-hidden" data-testid={`admin-product-${product.id}`}>
                  <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.subcategory} • {product.purity}
                    </p>
                    <p className="text-xl font-bold text-[#D4AF37] mb-3">
                      ₹{product.total_price.toLocaleString()}
                    </p>
                    <Button
                      onClick={() => handleDeleteProduct(product.id)}
                      variant="outline"
                      className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      data-testid={`delete-product-${product.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#F9F9F7] p-6 rounded-sm" data-testid={`admin-order-${order.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID: {order.id.substring(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="text-sm font-medium text-[#1A1A1A] mt-2">
                      Total: ₹{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[150px]" data-testid={`order-status-select-${order.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Sell Requests Tab */}
          <TabsContent value="sell" className="space-y-4">
            {sellRequests.map((request) => (
              <div key={request.id} className="bg-[#F9F9F7] p-6 rounded-sm" data-testid={`admin-sell-request-${request.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-serif text-[#1A1A1A] capitalize">{request.jewellery_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Weight: {request.weight}g • Purity: {request.purity}
                    </p>
                    {request.estimated_value && (
                      <p className="text-lg font-bold text-[#D4AF37] mt-2">
                        Est: ₹{request.estimated_value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Select
                    value={request.status}
                    onValueChange={(value) => handleUpdateSellRequest(request.id, value)}
                  >
                    <SelectTrigger className="w-[150px]" data-testid={`sell-request-status-select-${request.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;