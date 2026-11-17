import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { bearer } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.MY_PORT || 5000}`,
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'hostel-help-system-secure-better-auth-secret-key-32chars',
  database: mongodbAdapter(db, { client }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user"
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true
  },
  plugins: [
    bearer()
  ]
});

export async function ensureAdminUser() {
  const adminEmail = (process.env.admin_email || 'admin@hostel.com').toLowerCase();
  const adminPassword = process.env.admin_password || 'admin@123';
  try {
    const existing = await db.collection("user").findOne({ email: adminEmail });
    if (!existing) {
      await auth.api.signUpEmail({
        body: {
          name: "Admin",
          email: adminEmail,
          password: adminPassword
        }
      });
      await db.collection("user").updateOne(
        { email: adminEmail },
        { $set: { role: "admin" } }
      );
      console.log("✅ Better Auth: Admin account initialized");
    }
  } catch (_) {}
}
