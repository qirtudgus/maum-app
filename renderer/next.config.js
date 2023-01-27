module.exports = {
  reactStrictMode: false,
  compiler: {
    styledComponents: { displayName: true, ssr: true, minify: true },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }

    return config;
  },
};
