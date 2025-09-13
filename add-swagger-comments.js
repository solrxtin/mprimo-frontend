const fs = require('fs');
const path = require('path');

// Swagger comment templates for different controller types
const swaggerTemplates = {
  auth: {
    register: `/**
 * #swagger.tags = ['Authentication']
 * #swagger.summary = 'User Registration'
 * #swagger.description = 'Register a new user account'
 * #swagger.parameters['body'] = {
 *   in: 'body',
 *   required: true,
 *   schema: { $ref: '#/definitions/User' }
 * }
 */`,
    login: `/**
 * #swagger.tags = ['Authentication'] 
 * #swagger.summary = 'User Login'
 * #swagger.description = 'Authenticate user and return JWT token'
 */`,
    logout: `/**
 * #swagger.tags = ['Authentication']
 * #swagger.summary = 'User Logout'
 * #swagger.security = [{ "Bearer": [] }]
 */`
  },
  
  product: {
    create: `/**
 * #swagger.tags = ['Products']
 * #swagger.summary = 'Create Product'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.parameters['body'] = {
 *   in: 'body',
 *   schema: { $ref: '#/definitions/Product' }
 * }
 */`,
    getAll: `/**
 * #swagger.tags = ['Products']
 * #swagger.summary = 'Get All Products'
 * #swagger.parameters['page'] = { in: 'query', type: 'integer' }
 * #swagger.parameters['limit'] = { in: 'query', type: 'integer' }
 */`,
    getById: `/**
 * #swagger.tags = ['Products']
 * #swagger.summary = 'Get Product by ID'
 * #swagger.parameters['id'] = { in: 'path', required: true, type: 'string' }
 */`
  },

  order: {
    create: `/**
 * #swagger.tags = ['Orders']
 * #swagger.summary = 'Create Order'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.parameters['body'] = {
 *   in: 'body',
 *   schema: { $ref: '#/definitions/Order' }
 * }
 */`,
    getAll: `/**
 * #swagger.tags = ['Orders']
 * #swagger.summary = 'Get All Orders'
 * #swagger.security = [{ "Bearer": [] }]
 */`
  },

  admin: {
    getUsers: `/**
 * #swagger.tags = ['Admin - Users']
 * #swagger.summary = 'Get All Users'
 * #swagger.security = [{ "Bearer": [] }]
 */`,
    getVendors: `/**
 * #swagger.tags = ['Admin - Vendors']
 * #swagger.summary = 'Get All Vendors'
 * #swagger.security = [{ "Bearer": [] }]
 */`,
    createBanner: `/**
 * #swagger.tags = ['Admin - Content']
 * #swagger.summary = 'Create Banner'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.parameters['body'] = {
 *   in: 'body',
 *   schema: { $ref: '#/definitions/Banner' }
 * }
 */`
  },

  vendor: {
    uploadDocument: `/**
 * #swagger.tags = ['Vendor']
 * #swagger.summary = 'Upload Verification Document'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.consumes = ['multipart/form-data']
 */`,
    getProfile: `/**
 * #swagger.tags = ['Vendor']
 * #swagger.summary = 'Get Vendor Profile'
 * #swagger.security = [{ "Bearer": [] }]
 */`
  },

  wallet: {
    getBalance: `/**
 * #swagger.tags = ['Wallet']
 * #swagger.summary = 'Get Wallet Balance'
 * #swagger.security = [{ "Bearer": [] }]
 */`,
    addFunds: `/**
 * #swagger.tags = ['Wallet']
 * #swagger.summary = 'Add Funds to Wallet'
 * #swagger.security = [{ "Bearer": [] }]
 */`
  }
};

console.log('Swagger comment templates created. Add these manually to your controller methods as needed.');
console.log('Run: node swagger-docs.js to generate complete documentation.');