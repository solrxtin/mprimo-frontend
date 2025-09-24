import mongoose from "mongoose";
import dotenv from "dotenv";
import FAQ from "../models/faq.model";
import User from "../models/user.model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI!;

const faqData = [
  // Orders & Shipping
  {
    question: "How do I track my order?",
    answer: "To track your order: 1) Log into your account and go to 'My Orders' section, 2) Find your order and click 'Track Order' to see real-time status updates, 3) You'll receive email notifications for status changes including 'Processing', 'Shipped', 'Out for Delivery', and 'Delivered', 4) Use the tracking number provided in your shipping confirmation email on the carrier's website for detailed delivery information.",
    category: "Orders & Shipping",
    tags: ["order tracking", "shipping", "delivery", "order status"]
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping times vary by location and method: Standard shipping takes 3-7 business days, Express shipping takes 1-3 business days, and Same-day delivery is available in select cities. International orders typically take 7-14 business days depending on customs processing.",
    category: "Orders & Shipping",
    tags: ["shipping time", "delivery", "international shipping"]
  },
  {
    question: "Can I cancel or modify my order?",
    answer: "You can cancel or modify your order within 1 hour of placing it if it hasn't been processed yet. Go to 'My Orders', find your order, and click 'Cancel' or 'Modify'. Once an order is marked as 'Processing' or 'Shipped', changes cannot be made.",
    category: "Orders & Shipping",
    tags: ["cancel order", "modify order", "order changes"]
  },
  {
    question: "What are the shipping costs?",
    answer: "Shipping costs depend on your location, order value, and shipping method. Standard shipping is free for orders over $50. Express shipping starts at $9.99. Same-day delivery is $19.99 where available. International shipping rates are calculated at checkout based on destination and package weight.",
    category: "Orders & Shipping",
    tags: ["shipping cost", "free shipping", "delivery fees"]
  },

  // Payment & Billing
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and cryptocurrency payments. For orders over $500, we also accept bank transfers and wire transfers.",
    category: "Payment & Billing",
    tags: ["payment methods", "credit card", "paypal", "cryptocurrency"]
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes, we use industry-standard SSL encryption and PCI DSS compliance to protect your payment information. We never store your full credit card details on our servers. All transactions are processed through secure payment gateways like Stripe and PayPal.",
    category: "Payment & Billing",
    tags: ["payment security", "SSL", "encryption", "PCI compliance"]
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, we offer refunds within 30 days of purchase for unused items in original condition. Digital products and personalized items are non-refundable. To request a refund, go to 'My Orders', select the item, and click 'Request Refund'. Refunds are processed within 5-7 business days.",
    category: "Payment & Billing",
    tags: ["refund", "return policy", "money back"]
  },

  // Account Management
  {
    question: "How do I reset my password?",
    answer: "To reset your password: 1) Click 'Forgot Password' on the login page, 2) Enter your email address, 3) Check your email for a reset link, 4) Click the link and create a new password, 5) Your new password must be at least 8 characters with uppercase, lowercase, and numbers.",
    category: "Account Management",
    tags: ["password reset", "login", "account recovery"]
  },
  {
    question: "How do I update my profile information?",
    answer: "To update your profile: 1) Log into your account, 2) Go to 'Account Settings' or 'Profile', 3) Edit your personal information, shipping addresses, or preferences, 4) Click 'Save Changes'. You can update your name, email, phone number, and addresses anytime.",
    category: "Account Management",
    tags: ["profile update", "account settings", "personal information"]
  },
  {
    question: "How do I delete my account?",
    answer: "To delete your account: 1) Go to 'Account Settings', 2) Scroll to 'Account Actions', 3) Click 'Delete Account', 4) Confirm your decision. Note: This action is permanent and will remove all your data, order history, and saved items. Consider deactivating instead if you might return.",
    category: "Account Management",
    tags: ["delete account", "account closure", "data removal"]
  },

  // Selling & Vendor
  {
    question: "How do I become a seller?",
    answer: "To become a seller: 1) Click 'Sell on Our Platform' in the footer, 2) Choose between Personal or Business account, 3) Complete the registration with your business information, 4) Verify your identity with required documents, 5) Set up your payment details, 6) Start listing products. Business accounts have higher limits and more features.",
    category: "Selling & Vendor",
    tags: ["become seller", "vendor registration", "selling account"]
  },
  {
    question: "What are the seller fees?",
    answer: "Seller fees vary by subscription plan: Starter (Free) - 8% commission, Professional ($29/month) - 5% commission, Elite ($99/month) - 3% commission. Additional fees may apply for payment processing (2.9% + $0.30) and optional services like promoted listings.",
    category: "Selling & Vendor",
    tags: ["seller fees", "commission", "subscription plans"]
  },
  {
    question: "How do I list a product?",
    answer: "To list a product: 1) Go to your Seller Dashboard, 2) Click 'Add Product', 3) Fill in product details (title, description, category, price), 4) Upload high-quality images, 5) Set inventory and shipping options, 6) Choose listing type (instant buy or auction), 7) Review and publish. Ensure all required fields are completed.",
    category: "Selling & Vendor",
    tags: ["list product", "add product", "product listing"]
  },

  // Technical Support
  {
    question: "The website is not loading properly. What should I do?",
    answer: "If the website isn't loading: 1) Clear your browser cache and cookies, 2) Try a different browser or incognito mode, 3) Check your internet connection, 4) Disable browser extensions temporarily, 5) Try accessing from a different device. If issues persist, contact our technical support team.",
    category: "Technical Support",
    tags: ["website issues", "loading problems", "browser issues"]
  },
  {
    question: "I'm having trouble uploading images. What's wrong?",
    answer: "Image upload issues can be caused by: 1) File size too large (max 10MB per image), 2) Unsupported format (use JPG, PNG, or WebP), 3) Poor internet connection, 4) Browser issues. Try resizing your images, using a different browser, or uploading one image at a time.",
    category: "Technical Support",
    tags: ["image upload", "file size", "supported formats"]
  },

  // Policies & Safety
  {
    question: "What is your return policy?",
    answer: "Our return policy allows returns within 30 days of delivery for most items. Items must be unused, in original packaging, and in resalable condition. Digital products, personalized items, and perishables are non-returnable. Return shipping costs are covered by us for defective items, otherwise buyer pays return shipping.",
    category: "Policies & Safety",
    tags: ["return policy", "returns", "refund policy"]
  },
  {
    question: "How do you protect against fraud?",
    answer: "We protect against fraud through: 1) Advanced AI fraud detection systems, 2) Secure payment processing with encryption, 3) Seller verification and background checks, 4) Buyer protection programs, 5) 24/7 monitoring of suspicious activities, 6) Secure escrow services for high-value transactions.",
    category: "Policies & Safety",
    tags: ["fraud protection", "security", "buyer protection"]
  },
  {
    question: "What items are prohibited on your platform?",
    answer: "Prohibited items include: illegal goods, weapons, drugs, counterfeit products, adult content, hazardous materials, live animals, and items that violate intellectual property rights. For a complete list, please review our Prohibited Items Policy in the Terms of Service.",
    category: "Policies & Safety",
    tags: ["prohibited items", "banned products", "policy violations"]
  }
];

async function seedFAQs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      throw new Error("No admin user found. Please create an admin user first.");
    }

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log("Cleared existing FAQs");

    // Create FAQs
    const faqs = await FAQ.insertMany(
      faqData.map(faq => ({
        ...faq,
        createdBy: adminUser._id,
        status: "published",
        viewCount: Math.floor(Math.random() * 100),
        isHelpful: Math.floor(Math.random() * 50),
        isNotHelpful: Math.floor(Math.random() * 10)
      }))
    );

    console.log(`✅ Successfully seeded ${faqs.length} FAQs`);
    
    // Display summary by category
    const categories = [...new Set(faqData.map(faq => faq.category))];
    categories.forEach(category => {
      const count = faqData.filter(faq => faq.category === category).length;
      console.log(`   ${category}: ${count} FAQs`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding FAQs:", error);
    process.exit(1);
  }
}

seedFAQs();