import requests
import sys
import json
from datetime import datetime

class JewelleryStoreAPITester:
    def __init__(self, base_url="https://gemgallery-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.customer_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_product_id = None
        self.created_order_id = None
        self.created_sell_request_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                    self.log_result(name, True, details)
                    return True, response_data
                except:
                    self.log_result(name, True, details)
                    return True, {}
            elif success:
                self.log_result(name, True, details)
                return True, {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:100]}"
                self.log_result(name, False, details)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_customer_signup(self):
        """Test customer signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "email": f"testcustomer{timestamp}@test.com",
            "password": "testpass123",
            "full_name": "Test Customer",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "Customer Signup",
            "POST",
            "auth/signup",
            200,
            data=customer_data
        )
        
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            return True
        return False

    def test_admin_signup(self):
        """Test admin signup (create admin user)"""
        admin_data = {
            "email": "admin@luxejewels.com",
            "password": "admin123",
            "full_name": "Admin User",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin Signup",
            "POST",
            "auth/signup",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_data = {
            "email": "admin@luxejewels.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.customer_token:
            self.log_result("Get Current User", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        return success

    def test_get_products(self):
        """Test get products endpoint"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            # Use the first product for testing
            self.created_product_id = response[0]['id']
            self.log_result("Products List Check", True, f"Found {len(response)} products, using first product ID: {self.created_product_id}")
            return True
        elif success and isinstance(response, list):
            self.log_result("Products List Check", len(response) > 0, f"Found {len(response)} products")
            return len(response) > 0
        return False

    def test_create_product(self):
        """Test create product (admin only)"""
        if not self.admin_token:
            self.log_result("Create Product", False, "No admin token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        product_data = {
            "name": "Test Gold Ring",
            "category": "ring",
            "subcategory": "gold",
            "description": "A beautiful test gold ring",
            "weight": 5.5,
            "purity": "22K",
            "metal_price": 25000,
            "making_charges": 5000,
            "gst": 900,
            "total_price": 30900,
            "image_url": "https://images.unsplash.com/photo-1696774665695-2f237304c3b0",
            "images": [],
            "in_stock": True
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            return True
        return False

    def test_get_single_product(self):
        """Test get single product"""
        if not self.created_product_id:
            self.log_result("Get Single Product", False, "No product ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.created_product_id}",
            200
        )
        return success

    def test_add_to_cart(self):
        """Test add to cart"""
        if not self.customer_token or not self.created_product_id:
            self.log_result("Add to Cart", False, "Missing customer token or product ID")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        cart_data = {
            "product_id": self.created_product_id,
            "quantity": 1
        }
        
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data=cart_data,
            headers=headers
        )
        return success

    def test_get_cart(self):
        """Test get cart"""
        if not self.customer_token:
            self.log_result("Get Cart", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200,
            headers=headers
        )
        return success

    def test_create_order(self):
        """Test create order"""
        if not self.customer_token or not self.created_product_id:
            self.log_result("Create Order", False, "Missing customer token or product ID")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        order_data = {
            "items": [
                {
                    "product_id": self.created_product_id,
                    "product_name": "Test Gold Ring",
                    "quantity": 1,
                    "price": 30900
                }
            ],
            "total_amount": 30900,
            "shipping_address": {
                "full_name": "Test Customer",
                "phone": "9876543210",
                "address_line1": "123 Test Street",
                "address_line2": "",
                "city": "Test City",
                "state": "Test State",
                "pincode": "123456"
            },
            "payment_method": "cash_on_delivery"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            return True
        return False

    def test_get_orders(self):
        """Test get orders"""
        if not self.customer_token:
            self.log_result("Get Orders", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200,
            headers=headers
        )
        return success

    def test_create_sell_request(self):
        """Test create sell jewellery request"""
        if not self.customer_token:
            self.log_result("Create Sell Request", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        sell_data = {
            "jewellery_type": "ring",
            "weight": 10.5,
            "purity": "22K",
            "description": "Old gold ring to sell"
        }
        
        success, response = self.run_test(
            "Create Sell Request",
            "POST",
            "sell-jewellery",
            200,
            data=sell_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_sell_request_id = response['id']
            return True
        return False

    def test_get_sell_requests(self):
        """Test get sell requests"""
        if not self.customer_token:
            self.log_result("Get Sell Requests", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        success, response = self.run_test(
            "Get Sell Requests",
            "GET",
            "sell-jewellery",
            200,
            headers=headers
        )
        return success

    def test_save_item(self):
        """Test save item"""
        if not self.customer_token or not self.created_product_id:
            self.log_result("Save Item", False, "Missing customer token or product ID")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        save_data = {
            "product_id": self.created_product_id
        }
        
        success, response = self.run_test(
            "Save Item",
            "POST",
            "saved-items",
            200,
            data=save_data,
            headers=headers
        )
        return success

    def test_get_saved_items(self):
        """Test get saved items"""
        if not self.customer_token:
            self.log_result("Get Saved Items", False, "No customer token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.customer_token}'
        }
        
        success, response = self.run_test(
            "Get Saved Items",
            "GET",
            "saved-items",
            200,
            headers=headers
        )
        return success

    def test_admin_stats(self):
        """Test admin stats"""
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers=headers
        )
        return success

    def test_update_order_status(self):
        """Test update order status (admin only)"""
        if not self.admin_token or not self.created_order_id:
            self.log_result("Update Order Status", False, "Missing admin token or order ID")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{self.created_order_id}/status?status=confirmed",
            200,
            headers=headers
        )
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Jewellery Store API Tests...")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📝 Authentication Tests:")
        self.test_customer_signup()
        self.test_admin_signup()  # Create admin user first
        self.test_admin_login()
        self.test_get_current_user()
        
        # Product Tests
        print("\n🛍️ Product Tests:")
        self.test_get_products()
        self.test_create_product()
        self.test_get_single_product()
        
        # Cart Tests
        print("\n🛒 Cart Tests:")
        self.test_add_to_cart()
        self.test_get_cart()
        
        # Order Tests
        print("\n📦 Order Tests:")
        self.test_create_order()
        self.test_get_orders()
        self.test_update_order_status()
        
        # Sell Jewellery Tests
        print("\n💰 Sell Jewellery Tests:")
        self.test_create_sell_request()
        self.test_get_sell_requests()
        
        # Saved Items Tests
        print("\n❤️ Saved Items Tests:")
        self.test_save_item()
        self.test_get_saved_items()
        
        # Admin Tests
        print("\n👑 Admin Tests:")
        self.test_admin_stats()
        
        # Print Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = JewelleryStoreAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())