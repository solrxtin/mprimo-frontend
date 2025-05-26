// import swaggerAutogen from "swagger-autogen";
const swaggerAutogen = require("swagger-autogen")();
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
  
};

const outputFile = "../swagger-output.json";
const endpointsFiles = ["src/routes/*.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);