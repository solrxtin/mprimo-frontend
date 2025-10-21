const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mprimo');

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function testAuctionProducts() {
  try {
    console.log('🔍 Testing Auction Products...\n');

    // Count total auction products
    const totalAuctions = await Product.countDocuments({
      "inventory.listing.type": "auction"
    });
    console.log(`📊 Total Auction Products: ${totalAuctions}`);

    // Count live auctions
    const liveAuctions = await Product.countDocuments({
      "inventory.listing.type": "auction",
      "inventory.listing.auction.isStarted": true,
      "inventory.listing.auction.isExpired": false
    });
    console.log(`🔴 Live Auctions: ${liveAuctions}`);

    // Count upcoming auctions
    const upcomingAuctions = await Product.countDocuments({
      "inventory.listing.type": "auction",
      "inventory.listing.auction.isStarted": false,
      "inventory.listing.auction.isExpired": false
    });
    console.log(`🟡 Upcoming Auctions: ${upcomingAuctions}`);

    // Count ended auctions
    const endedAuctions = await Product.countDocuments({
      "inventory.listing.type": "auction",
      "inventory.listing.auction.isExpired": true
    });
    console.log(`🟢 Ended Auctions: ${endedAuctions}`);

    // Sample auction products
    const sampleAuctions = await Product.find({
      "inventory.listing.type": "auction"
    }).limit(3).select('name inventory.listing.auction');

    console.log('\n📋 Sample Auction Products:');
    sampleAuctions.forEach((product, index) => {
      const auction = product.inventory.listing.auction;
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - Started: ${auction.isStarted}`);
      console.log(`   - Expired: ${auction.isExpired}`);
      console.log(`   - Start Time: ${auction.startTime}`);
      console.log(`   - End Time: ${auction.endTime}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAuctionProducts();