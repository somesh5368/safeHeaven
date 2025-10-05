// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/usgs', createProxyMiddleware({
    target: 'https://earthquake.usgs.gov',
    changeOrigin: true,
    pathRewrite: {'^/usgs': ''},
  }));
  
  app.use('/nws', createProxyMiddleware({
    target: 'https://api.weather.gov',
    changeOrigin: true,
    pathRewrite: {'^/nws': ''},
  }));
};
