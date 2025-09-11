const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: "Mprimo API Documentation",
    version: "1.0.0",
    description: "API documentation for Mprimo application",
    contact: {
      support: {
        name: "Support",
        email: "support@mprimo.com",
      },
    },
  },
  host: process.env.HOST || "localhost:5800",
  basePath: "/api/v1",
  schemes: ["http", "https"],
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
    }
  },
  definitions: {
    Advertisement: {
      type: "object",
      required: ["title", "description", "targetUrl", "adType", "duration"],
      properties: {
        title: { type: "string", maxLength: 100 },
        description: { type: "string", maxLength: 300 },
        targetUrl: { type: "string" },
        adType: { type: "string", enum: ["banner", "featured", "sponsored"] },
        duration: { type: "number", minimum: 1 }
      }
    },
    Promotion: {
      type: "object",
      required: ["title", "description", "startDate", "endDate"],
      properties: {
        title: { type: "string", maxLength: 100 },
        description: { type: "string", maxLength: 500 },
        status: { type: "string", enum: ["active", "inactive", "expired"] },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" }
      }
    }
  }
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = ['./src/routes/*.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);