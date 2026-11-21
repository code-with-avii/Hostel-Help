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
  secret: process.env.BETTER_AUTH_SECRET || "hostel_help_secure_better_auth_secret_key_32_characters_long",
  database: mongodbAdapter(db, { client }),
  trustedOrigins: [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:6000",
    "http://127.0.0.1:6000"
  ],
  advanced: {
    disableCSRFCheck: true,
    disableOriginCheck: true,
    useSecureCookies: false,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false
    }
  },
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
