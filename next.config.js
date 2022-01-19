/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.GITHUB_ACTIONS ? "/rust-component-tracker" : "",
  trailingSlash: true,
};

module.exports = nextConfig;
