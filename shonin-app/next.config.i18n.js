const withNextIntl = require('next-intl/plugin')(
  // これは i18n/request.ts ファイルのパスです
  './i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

module.exports = withNextIntl(nextConfig) 