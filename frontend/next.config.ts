import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js es detectado automaticamente por Vercel.
  // No se requiere config adicional: el frontend se deploya desde la carpeta frontend/.
  // Si en el futuro Recharts da problemas de SSR, agregar:
  // transpilePackages: ["recharts"],
};

export default nextConfig;
