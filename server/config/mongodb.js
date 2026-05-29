const { MongoClient } = require("mongodb");
require("dotenv").config();

let client;
let db;

const connectMongo = async () => {
  if (db) return db;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required for SupplyBook");
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log("✅ Successfully connected to the SupplyBook MongoDB database!");

  return db;
};

const getMongoDb = async () => connectMongo();

module.exports = { connectMongo, getMongoDb };
