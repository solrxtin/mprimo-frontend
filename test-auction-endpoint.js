const axios = require('axios');

const BASE_URL = 'http://localhost:5800/api/v1';

async function testAuctionEndpoints() {
  try {
    console.log('🧪 Testing Auction Endpoints...\n');

    // Test all auction products
    console.log('📊 Testing: GET /products/auctions');
    const allAuctions = await axios.get(`${BASE_URL}/products/auctions`);
    console.log(`Total auctions: ${allAuctions.data.pagination.total}`);
    console.log(`Products returned: ${allAuctions.data.products.length}\n`);

    // Test live auctions
    console.log('🔴 Testing: GET /products/auctions?status=live');
    const liveAuctions = await axios.get(`${BASE_URL}/products/auctions?status=live`);
    console.log(`Live auctions: ${liveAuctions.data.pagination.total}`);
    console.log(`Products returned: ${liveAuctions.data.products.length}\n`);

    // Test upcoming auctions
    console.log('🟡 Testing: GET /products/auctions?status=upcoming');
    const upcomingAuctions = await axios.get(`${BASE_URL}/products/auctions?status=upcoming`);
    console.log(`Upcoming auctions: ${upcomingAuctions.data.pagination.total}`);
    console.log(`Products returned: ${upcomingAuctions.data.products.length}\n`);

    // Test ended auctions
    console.log('🟢 Testing: GET /products/auctions?status=ended');
    const endedAuctions = await axios.get(`${BASE_URL}/products/auctions?status=ended`);
    console.log(`Ended auctions: ${endedAuctions.data.pagination.total}`);
    console.log(`Products returned: ${endedAuctions.data.products.length}\n`);

    // Check if products have priceInfo (from enrichment)
    if (allAuctions.data.products.length > 0) {
      const firstProduct = allAuctions.data.products[0];
      console.log('✅ Sample product structure:');
      console.log(`- Has priceInfo: ${!!firstProduct.priceInfo}`);
      console.log(`- Has vendor: ${!!firstProduct.vendorId}`);
      console.log(`- Has country: ${!!firstProduct.country}`);
      console.log(`- Product name: ${firstProduct.name}`);
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
  }
}

testAuctionEndpoints();