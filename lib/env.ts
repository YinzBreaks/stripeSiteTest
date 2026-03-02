/**
 * Validates all required environment variables at module load time.
 * If any variable is missing the application will throw immediately,
 * preventing silent misconfigurations in production.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please add it to your .env.local file (see .env.local.example).`
    );
  }
  return value;
}

function requirePublicEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required public environment variable: ${key}\n` +
        `This variable must be prefixed with NEXT_PUBLIC_ and set in .env.local.`
    );
  }
  return value;
}

function makeEnv() {
  return {
    // Supabase – public (safe in browser)
    get NEXT_PUBLIC_SUPABASE_URL() {
      return requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL");
    },
    get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
      return requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    },

    // Supabase – server only
    get SUPABASE_SERVICE_ROLE_KEY() {
      return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    },

    // Stripe – public (safe in browser)
    get NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY() {
      return requirePublicEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    },

    // Stripe – server only
    get STRIPE_SECRET_KEY() {
      return requireEnv("STRIPE_SECRET_KEY");
    },
    get STRIPE_WEBHOOK_SECRET() {
      return requireEnv("STRIPE_WEBHOOK_SECRET");
    },

    // Site
    get NEXT_PUBLIC_SITE_URL() {
      return requirePublicEnv("NEXT_PUBLIC_SITE_URL");
    },
    get ADMIN_EMAIL() {
      return requireEnv("ADMIN_EMAIL");
    },
  } as const;
}

export const env = makeEnv();
