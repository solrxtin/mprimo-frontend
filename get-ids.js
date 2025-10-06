const mongoose = require('mongoose');
require('dotenv').config();

async function getIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get a category
    const categories = await mongoose.connection.db.collection('categories').findOne({ level: 1 });
    console.log('Category ID:', categories?._id);
    
    // Get a country
    const country = await mongoose.connection.db.collection('countries').findOne();
    console.log('Country ID:', country?._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getIds();