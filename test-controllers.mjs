import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';



const BASE_URL = "http://localhost:5800/api/v1";
let authToken = "";
let testProductId = "68e237d945464896b26a3f1e";
let testOptionId = "68e237d945464896b26a3f23";

const jar = new CookieJar();

const axiosInstance = wrapper(axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  jar
}));


// Test data
const testUser = {
  email: "john.smith@example.com",
  password: "UserPass123!",
};

const testVendor = {
  email: "ekoelectronics@example.com",
  password: "VendorPass123!",
};

const testProduct = {
  name: "Test Product for Controllers",
  brand: "Test Brand",
  description: "This is a test product to verify controllers work correctly",
  condition: "new",
  category: {
    main: "68e0e018080e82dadf18187e",
    sub: [],
    path: ["Electronics"],
  },
  country: "68cc390ec3e6d92575fc0906",
  inventory: {
    listing: {
      type: "instant",
      instant: {
        acceptOffer: true,
      },
    },
  },
  images: ["https://via.placeholder.com/400x400?text=Test+Product"],
  specifications: [
    { key: "Brand", value: "Test Brand" },
    { key: "Warranty Period", value: "1 Year" },
  ],
  shipping: {
    weight: 1.0,
    unit: "kg",
    dimensions: {
      length: 10,
      width: 8,
      height: 6,
    },
    restrictions: ["none"],
  },
  variants: [
    {
      name: "Size & Color",
      isDefault: true,
      options: [
        {
          value: "Small Black",
          sku: "TEST-SM-BLK-001",
          price: 99.99,
          quantity: 10,
          isDefault: true,
          dimensions: { Size: "Small", Color: "Black" },
        },
        {
          value: "Medium White",
          sku: "TEST-MD-WHT-002",
          price: 109.99,
          quantity: 15,
          isDefault: false,
          dimensions: { Size: "Medium", Color: "White" },
        },
      ],
    },
  ],
  variantDimensions: ["Size", "Color"],
};

// async function registerUser() {
//   try {
//     console.log('📝 Registering test user...');
//     const registerData = {
//       ...testUser,
//       role: 'business' // Need business role to create products
//     };
//     await axios.post(`${BASE_URL}/auth/register`, registerData);
//     console.log('✅ User registered successfully');
//     return true;
//   } catch (error) {
//     if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
//       console.log('ℹ️ User already exists, proceeding to login');
//       return true;
//     }
//     console.error('❌ Registration failed:', error.response?.data?.message || error.message);
//     if (error.code === 'ECONNREFUSED') {
//       console.error('Server is not running. Please start the server first.');
//     }
//     if (error.response?.data) {
//       console.error('Full error:', JSON.stringify(error.response.data, null, 2));
//     }
//     return false;
//   }
// }

async function login(user = testUser) {
  try {
    console.log("🔐 Logging in...");
    console.log("User data is:", user);
    const response = await axiosInstance.post(`/auth/login`, user);
    console.log("✅ Login successful");
    return true;
  } catch (error) {
    console.error(
      "❌ Login failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}


// async function testCreateProduct() {
//   try {
//     console.log("\n📦 Testing createProduct...");
//     const response = await axiosInstance.post(`/products`, testProduct);

//     testProductId = response.data.product._id;
//     testOptionId = response.data.product.variants[0].options[0]._id;

//     console.log("✅ Product created successfully");
//     console.log(`   Product ID: ${testProductId}`);
//     console.log(`   Option ID: ${testOptionId}`);
//     return true;
//   } catch (error) {
//     console.error(
//       "❌ Create product failed:",
//       error.response?.data?.message || error.message
//     );
//     if (error.response?.data) {
//       console.error(
//         "   Error details:",
//         JSON.stringify(error.response.data, null, 2)
//       );
//     }
//     return false;
//   }
// }


async function testAddToCart() {
  try {
    console.log("\n🛒 Testing addToCart...");
    const cartData = {
      productId: testProductId,
      quantity: 2,
      price: 99.99,
      optionId: testOptionId,
    };

    const response = await axiosInstance.post(`/products/cart`, cartData);

    console.log("✅ Added to cart successfully");
    console.log(`   Message: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error(
      "❌ Add to cart failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "   Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return false;
  }
}

async function testAddToWishlist() {
  try {
    console.log("\n❤️ Testing addToWishlist...");
    const wishlistData = {
      optionId: testOptionId,
    };

    const response = await axiosInstance.post(
      `/products/wishlist/${testProductId}`,
      wishlistData,
    );

    console.log("✅ Added to wishlist successfully");
    console.log(`   Message: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error(
      "❌ Add to wishlist failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "   Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return false;
  }
}

async function testGetCart() {
  try {
    console.log("\n🛒 Testing getCart...");
    const response = await axiosInstance.get(`/products/cart/user`);

    console.log("✅ Cart retrieved successfully");
    console.log(`   Cart items: ${response.data.cart?.length || 0}`);
    if (response.data.cart?.length > 0) {
      console.log("   First item:", {
        productId: response.data.cart[0].productId,
        quantity: response.data.cart[0].quantity,
        price: response.data.cart[0].price,
        name: response.data.cart[0].name,
      });
    }
    return true;
  } catch (error) {
    console.error(
      "❌ Get cart failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "   Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return false;
  }
}

async function testGetWishlist() {
  try {
    console.log("\n❤️ Testing getWishlist...");
    const response = await axiosInstance.get(`/products/wishlist/user`);

    console.log("✅ Wishlist retrieved successfully");
    console.log(`   Wishlist items: ${response.data.data?.length || 0}`);
    if (response.data.data?.length > 0) {
      console.log("   First item:", {
        productId: response.data.data[0].productId,
        price: response.data.data[0].price,
        name: response.data.data[0].name,
      });
    }
    return true;
  } catch (error) {
    console.error(
      "❌ Get wishlist failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "   Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return false;
  }
}

async function testSearchProducts() {
  try {
    console.log("\n🔍 Testing searchProducts...");
    
    // Test 1: Search with query
    const searchResponse = await axiosInstance.get(`/products/search?q=led&page=1&limit=5`);
    console.log("✅ Search with query successful");
    console.log(`   Products found: ${searchResponse.data.products?.length || 0}`);
    console.log(`   Total results: ${searchResponse.data.pagination?.total || 0}`);
    console.log(`   Suggestions: ${searchResponse.data.suggestions?.length || 0}`);
    
    // Test 2: Search without query (should return all products)
    const allProductsResponse = await axiosInstance.get(`/products/search?page=1&limit=5`);
    console.log("✅ Search without query successful");
    console.log(`   All products found: ${allProductsResponse.data.products?.length || 0}`);
    console.log(`   Total all results: ${allProductsResponse.data.pagination?.total || 0}`);
    
    return true;
  } catch (error) {
    console.error(
      "❌ Search products failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "   Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting Controller Tests...\n");

  // // Step 1: Register user
  // const registerSuccess = await registerUser();
  // if (!registerSuccess) {
  //   console.log("\n❌ Tests failed - Could not register user");
  //   return;
  // }

  // Step 2: Login
  // const loginSuccess = await login(testVendor);
  // if (!loginSuccess) {
  //   console.log("\n❌ Tests failed - Could not login vendor");
  //   return;
  // }


  // Step 3: Create Product
  // const createSuccess = await testCreateProduct();
  // if (!createSuccess) {
  //   console.log("\n❌ Tests failed - Could not create product");
  //   return;
  // }

  const loginUserSuccess = await login();
  if (!loginUserSuccess) {
    console.log("\n❌ Tests failed - Could not login vendor");
    return;
  }

  // Step 4: Add to Cart
  const cartSuccess = await testAddToCart();

  // Step 5: Add to Wishlist
  const wishlistSuccess = await testAddToWishlist();

  // Step 6: Get Cart
  const getCartSuccess = await testGetCart();

  // Step 7: Get Wishlist
  const getWishlistSuccess = await testGetWishlist();
  
  // Step 8: Test Search
  const searchSuccess = await testSearchProducts();

  // Summary
  console.log("\n📊 Test Results Summary:");
  // console.log(`   Register: ${registerSuccess ? "✅" : "❌"}`);
  // console.log(`   Login: ${loginSuccess ? "✅" : "❌"}`);
  // console.log(`   Create Product: ${createSuccess ? "✅" : "❌"}`);
  console.log(`   Add to Cart: ${cartSuccess ? "✅" : "❌"}`);
  console.log(`   Add to Wishlist: ${wishlistSuccess ? "✅" : "❌"}`);
  console.log(`   Get Cart: ${getCartSuccess ? "✅" : "❌"}`);
  console.log(`   Get Wishlist: ${getWishlistSuccess ? "✅" : "❌"}`);
  console.log(`   Search Products: ${searchSuccess ? "✅" : "❌"}`);

  const allPassed =
    loginUserSuccess &&
    cartSuccess &&
    wishlistSuccess &&
    getCartSuccess &&
    getWishlistSuccess &&
    searchSuccess;
  console.log(
    `\n${allPassed ? "🎉 All tests passed!" : "⚠️ Some tests failed"}`
  );
}

// Run the tests
runTests().catch(console.error);
