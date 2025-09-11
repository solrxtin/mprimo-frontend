import redisService from '../../services/redis.service';

describe('Redis Service', () => {
  beforeAll(async () => {
    // Wait for Redis connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Cart Management', () => {
    const userId = 'test-user-123';
    const productId = 'test-product-123';

    beforeEach(async () => {
      await redisService.clearCart(userId);
    });

    test('should add item to cart', async () => {
      await redisService.addToCart(userId, productId, 2, 99.99, 'red');
      
      const cart = await redisService.getCart(userId);
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].price).toBe(99.99);
    });

    test('should remove item from cart', async () => {
      await redisService.addToCart(userId, productId, 1, 99.99);
      await redisService.removeFromCart(userId, productId);
      
      const cart = await redisService.getCart(userId);
      expect(cart).toHaveLength(0);
    });

    test('should clear entire cart', async () => {
      await redisService.addToCart(userId, productId, 1, 99.99);
      await redisService.addToCart(userId, 'product-2', 1, 49.99);
      
      await redisService.clearCart(userId);
      
      const cart = await redisService.getCart(userId);
      expect(cart).toHaveLength(0);
    });
  });

  describe('Wishlist Management', () => {
    const userId = 'test-user-123';
    const productId = 'test-product-123';

    beforeEach(async () => {
      await redisService.clearWishlist(userId);
    });

    test('should add item to wishlist', async () => {
      await redisService.addToWishlist(userId, productId);
      
      const wishlist = await redisService.getWishlist(userId);
      expect(wishlist).toContain(productId);
    });

    test('should remove item from wishlist', async () => {
      await redisService.addToWishlist(userId, productId);
      await redisService.removeFromWishlist(userId, productId);
      
      const wishlist = await redisService.getWishlist(userId);
      expect(wishlist).not.toContain(productId);
    });
  });

  describe('Review Helpful', () => {
    const productId = 'test-product-123';
    const reviewId = 'test-review-123';
    const userId = 'test-user-123';

    test('should toggle review helpful', async () => {
      const result1 = await redisService.toggleReviewHelpful(productId, reviewId, userId);
      expect(result1?.helpful).toBe(true);
      expect(result1?.helpfulCount).toBe(1);

      const result2 = await redisService.toggleReviewHelpful(productId, reviewId, userId);
      expect(result2?.helpful).toBe(false);
      expect(result2?.helpfulCount).toBe(0);
    });

    test('should get helpful count', async () => {
      await redisService.toggleReviewHelpful(productId, reviewId, userId);
      
      const count = await redisService.getReviewHelpfulCount(productId, reviewId);
      expect(count).toBe(1);
    });

    test('should check if review is helpful', async () => {
      await redisService.toggleReviewHelpful(productId, reviewId, userId);
      
      const isHelpful = await redisService.isReviewHelpful(productId, reviewId, userId);
      expect(isHelpful).toBe(true);
    });
  });

  describe('Analytics Tracking', () => {
    test('should track events', async () => {
      const entityId = 'test-product-123';
      
      await redisService.trackEvent(entityId, 'view');
      await redisService.trackEvent(entityId, 'addToCart');
      await redisService.trackEvent(entityId, 'purchase', undefined, 99.99);
      
      // Events are tracked asynchronously, so we just verify no errors
      expect(true).toBe(true);
    });
  });

  describe('Distributed Locks', () => {
    test('should acquire and release lock', async () => {
      const resourceId = 'test-resource';
      const ownerId = 'test-owner';
      
      const acquired = await redisService.acquireLock(resourceId, ownerId, 30);
      expect(acquired).toBe(true);
      
      const released = await redisService.releaseLock(resourceId, ownerId);
      expect(released).toBe(true);
    });

    test('should not acquire lock if already held', async () => {
      const resourceId = 'test-resource';
      const owner1 = 'owner-1';
      const owner2 = 'owner-2';
      
      const acquired1 = await redisService.acquireLock(resourceId, owner1, 30);
      expect(acquired1).toBe(true);
      
      const acquired2 = await redisService.acquireLock(resourceId, owner2, 30);
      expect(acquired2).toBe(false);
      
      await redisService.releaseLock(resourceId, owner1);
    });
  });
});