import mongoose from 'mongoose';
import slugify from 'slugify';
import dotenv from 'dotenv';
import Product from '../models/product.model';


dotenv.config();

const generateUniqueSlug = async (name: string) => {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let exists = await Product.exists({ slug });
  let attempts = 0;

  while (exists && attempts < 5) {
    const random = Math.floor(1000 + Math.random() * 9000);
    slug = `${baseSlug}-${random}`;
    exists = await Product.exists({ slug });
    attempts++;
  }

  return slug;
};

const updateSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const products = await Product.find({ slug: { $exists: false } });

    console.log(`Found ${products.length} products without slugs.`);

    for (const product of products) {
      product.slug = await generateUniqueSlug(product.name);
      await product.save();
      console.log(`✅ Updated: ${product.name} → ${product.slug}`);
    }

    console.log('🎉 Slug generation complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating slugs:', err);
    process.exit(1);
  }
};

updateSlugs();