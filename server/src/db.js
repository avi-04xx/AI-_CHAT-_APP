import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("MONGODB_URI not set. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection failed:", err?.message || err);
  }
}

