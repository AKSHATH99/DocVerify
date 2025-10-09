/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        reactCompiler: false,
    },
    webpack: (config) => {
        // Force Solana adapter libs to use client React
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            react: require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
        };
        return config;
    },
};

export default nextConfig;
