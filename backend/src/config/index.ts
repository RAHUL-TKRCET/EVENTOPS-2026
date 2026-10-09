import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",

  jwt: {
    secret: process.env.JWT_SECRET || "eventops_super_secret_jwt_key_2026_secure",
    expiry: process.env.JWT_EXPIRY || "24h",
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || "eventops_refresh_token_secret_key_2026",
    refreshExpiry: "7d",
  },

  qr: {
    hmacSecret: process.env.QR_HMAC_SECRET || "eventops_qr_hmac_secret_cryptographic_pass_2026",
    tokenValidityHours: 48,
  },

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "eventops_user",
    password: process.env.DB_PASSWORD || "eventops_password",
    database: process.env.DB_NAME || "eventops_db",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
};

