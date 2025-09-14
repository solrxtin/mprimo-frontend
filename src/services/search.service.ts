import ProductModel from "../models/product.model";
import CategoryModel from "../models/category.model";
import redisService from "./redis.service";

export class SearchService {
  static async searchProducts(query: string, filters: any = {}, page = 1, limit = 10) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Build search conditions
    const searchConditions = [];
    
    if (searchTerms.length > 0) {
      searchConditions.push({
        $or: [
          { name: { $regex: searchTerms.join('|'), $options: 'i' } },
          { description: { $regex: searchTerms.join('|'), $options: 'i' } },
          { brand: { $regex: searchTerms.join('|'), $options: 'i' } },
          { 'specifications.value': { $regex: searchTerms.join('|'), $options: 'i' } }
        ]
      });
    }

    // Category search
    const categories = await CategoryModel.find({
      name: { $regex: query, $options: 'i' }
    }).select('_id');
    
    if (categories.length > 0) {
      const categoryIds = categories.map(cat => cat._id);
      searchConditions.push({
        $or: [
          { 'category.main': { $in: categoryIds } },
          { 'category.sub': { $in: categoryIds } }
        ]
      });
    }

    const searchQuery = {
      $and: [
        searchConditions.length > 0 ? { $or: searchConditions } : {},
        { status: 'active' },
        ...Object.entries(filters).map(([key, value]) => ({ [key]: value }))
      ].filter(condition => Object.keys(condition).length > 0)
    };

    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      ProductModel.find(searchQuery)
        .populate('vendorId', 'businessInfo.name')
        .populate('category.main', 'name')
        .sort({ 'analytics.views': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(searchQuery)
    ]);

    return {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  static async getSearchSuggestions(query: string, limit = 5) {
    if (query.length < 2) return [];
    
    // Get suggestions from Redis first
    const redisSuggestions = await redisService.getSuggestions(query, limit);
    if (redisSuggestions.length >= limit) {
      return redisSuggestions;
    }

    // Fallback to database search
    const [products, categories] = await Promise.all([
      ProductModel.find({
        $or: [
          { name: { $regex: `^${query}`, $options: 'i' } },
          { brand: { $regex: `^${query}`, $options: 'i' } }
        ],
        status: 'active'
      }).select('name brand').limit(limit).lean(),
      
      CategoryModel.find({
        name: { $regex: `^${query}`, $options: 'i' }
      }).select('name').limit(limit).lean()
    ]);

    const suggestions = [
      ...products.map(p => p.name),
      ...products.map(p => p.brand),
      ...categories.map(c => c.name)
    ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, limit);

    return suggestions;
  }

  static async searchWithFilters(searchParams: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    condition?: string;
    location?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      query = '',
      category,
      minPrice,
      maxPrice,
      brand,
      condition,
      sortBy = 'relevance',
      page = 1,
      limit = 10
    } = searchParams;

    const filters: any = { status: 'active' };
    
    if (category) filters['category.main'] = category;
    if (brand) filters.brand = { $regex: brand, $options: 'i' };
    if (condition) filters.condition = condition;
    
    if (minPrice || maxPrice) {
      filters['variants.options.price'] = {};
      if (minPrice) filters['variants.options.price'].$gte = minPrice;
      if (maxPrice) filters['variants.options.price'].$lte = maxPrice;
    }

    let sort: any = {};
    switch (sortBy) {
      case 'price_low':
        sort = { 'variants.options.price': 1 };
        break;
      case 'price_high':
        sort = { 'variants.options.price': -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { 'analytics.views': -1 };
        break;
      default:
        sort = { 'analytics.views': -1, createdAt: -1 };
    }

    if (query) {
      return this.searchProducts(query, filters, page, limit);
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      ProductModel.find(filters)
        .populate('vendorId', 'businessInfo.name')
        .populate('category.main', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filters)
    ]);

    return {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }
}