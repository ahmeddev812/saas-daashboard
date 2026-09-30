import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Strict Mode on: effects run mount -> unmount -> mount in dev, which is
     exactly what hydration effects must survive. */
  reactStrictMode: true,
};

export default nextConfig;
