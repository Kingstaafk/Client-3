import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, Heart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [sellRequests, setSellRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, savedRes, sellRes] = await Promise.all([
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/saved-items`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sell-jewellery`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setOrders(ordersRes.data);
      setSavedItems(savedRes.data);
      setSellRequests(sellRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveItem = async (productId) => {
    try {
      await axios.delete(`${API}/saved-items/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Item removed from saved items");
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to unsave item:", error);
      toast.error("Failed to remove item");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-50",
      confirmed: "text-blue-600 bg-blue-50",
      shipped: "text-purple-600 bg-purple-50",
      delivered: "text-green-600 bg-green-50",
      reviewed: "text-blue-600 bg-blue-50",
      accepted: "text-green-600 bg-green-50",
      rejected: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="customer-dashboard">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-2" data-testid="dashboard-title">
            My Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#F9F9F7] p-6 rounded-sm">
            <Package className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-orders">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="bg-[#F9F9F7] p-6 rounded-sm">
            <Heart className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-saved">{savedItems.length}</p>
            <p className="text-sm text-muted-foreground">Saved Items</p>
          </div>
          <div className="bg-[#F9F9F7] p-6 rounded-sm">
            <DollarSign className="h-8 w-8 text-[#D4AF37] mb-3" />
            <p className="text-3xl font-bold text-[#1A1A1A]" data-testid="total-sell-requests">{sellRequests.length}</p>
            <p className="text-sm text-muted-foreground">Sell Requests</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-[#F9F9F7]">
            <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
            <TabsTrigger value="saved" data-testid="saved-tab">Saved Items</TabsTrigger>
            <TabsTrigger value="sell" data-testid="sell-tab">Sell Requests</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-[#F9F9F7] rounded-sm">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No orders yet</p>
                <Button onClick={() => navigate("/products")} className="btn-primary">
                  Start Shopping
                </Button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-[#F9F9F7] p-6 rounded-sm" data-testid={`order-${order.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID: {order.id.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(
                        order.status
                      )}`}
                      data-testid={`order-status-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]">
                          {item.product_name} x {item.quantity}
                        </span>
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#E5E5E5] pt-3 flex justify-between">
                    <span className="font-serif text-[#1A1A1A]">Total</span>
                    <span className="text-lg font-bold text-[#D4AF37]">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Saved Items Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedItems.length === 0 ? (
              <div className="text-center py-12 bg-[#F9F9F7] rounded-sm">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No saved items yet</p>
                <Button onClick={() => navigate("/products")} className="btn-primary">
                  Browse Collection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItems.map((item) => (
                  <div
                    key={item.saved_item.id}
                    className="bg-[#F9F9F7] rounded-sm overflow-hidden"
                    data-testid={`saved-item-${item.product.id}`}
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => navigate(`/products/${item.product.id}`)}
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">{item.product.name}</h3>
                      <p className="text-xl font-bold text-[#D4AF37] mb-3">
                        ₹{item.product.total_price.toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/products/${item.product.id}`)}
                          className="flex-1 btn-primary text-xs py-2"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => handleUnsaveItem(item.product.id)}
                          variant="outline"
                          className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-xs py-2"
                          data-testid={`unsave-button-${item.product.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sell Requests Tab */}
          <TabsContent value="sell" className="space-y-4">
            {sellRequests.length === 0 ? (
              <div className="text-center py-12 bg-[#F9F9F7] rounded-sm">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No sell requests yet</p>
                <Button onClick={() => navigate("/sell")} className="btn-primary">
                  Sell Your Jewellery
                </Button>
              </div>
            ) : (
              sellRequests.map((request) => (
                <div key={request.id} className="bg-[#F9F9F7] p-6 rounded-sm" data-testid={`sell-request-${request.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-serif text-[#1A1A1A] capitalize">{request.jewellery_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(
                        request.status
                      )}`}
                      data-testid={`sell-request-status-${request.id}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium text-[#1A1A1A]">{request.weight}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purity</p>
                      <p className="font-medium text-[#1A1A1A]">{request.purity}</p>
                    </div>
                  </div>
                  {request.estimated_value && (
                    <div className="border-t border-[#E5E5E5] pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        ₹{request.estimated_value.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;