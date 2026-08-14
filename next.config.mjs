/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module — never bundle it, load it at runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
