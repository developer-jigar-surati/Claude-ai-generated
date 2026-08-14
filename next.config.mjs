/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // libSQL ships optional native bindings — never bundle them.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
