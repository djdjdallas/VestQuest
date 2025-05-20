// Babel config with React support that doesn't interfere with Next.js's font system
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  // Add this configuration to make it compatible with SWC/Next.js font system
  assumptions: {
    setPublicClassFields: true,
  },
  // Explicitly exclude Next.js font imports from Babel processing
  ignore: [/node_modules/, /next\/font/]
};