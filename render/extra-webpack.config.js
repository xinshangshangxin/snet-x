const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'processEnv': {
        SHA: JSON.stringify(process.env.GITHUB_SHA),
      },
    }),
  ],
};
