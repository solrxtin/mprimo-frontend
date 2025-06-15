const mongoose = require("mongoose");
const dotenv = require("dotenv")

dotenv.config()

async function migrateProductDrafts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const draftCollectionExists = collections.some(col => col.name === "productdrafts");

    if (!draftCollectionExists) {
      console.log("ℹ️ Collection 'productdrafts' does not exist. Skipping migration.");
      await mongoose.disconnect();
      return;
    }

    const collection = db.collection("productdrafts");

    console.log("🔍 Checking existing indexes...");
    const indexes = await collection.indexes();

    const hasWrongIndex = indexes.find(i => i.key?.id === 1 && i.key?.userId === 1);
    if (hasWrongIndex) {
      console.log("⚠️ Found incorrect index: id_1_userId_1, dropping...");
      await collection.dropIndex("id_1_userId_1");
    }

    console.log("🧹 Removing broken drafts where draftId is null...");
    const result = await collection.deleteMany({ darftId: { $exists: true } });
    console.log(`✅ Removed ${result.deletedCount} invalid drafts.`);

    console.log("🔒 Ensuring correct index exists...");
    await collection.createIndex({ draftId: 1, userId: 1 }, { unique: true });

    console.log("🎉 Migration complete.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateProductDrafts();
