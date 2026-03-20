export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Plant Health Assistant",
  baseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  adminApiKey: process.env.ADMIN_API_KEY ?? "dev-admin-key",
  provider: (process.env.WHATSAPP_PROVIDER ?? "meta") as "meta" | "twilio",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "verify-token",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "plant-images"
};
