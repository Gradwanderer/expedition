module.exports = {
  lintOnSave: process.env.NODE_ENV !== 'production',
  devServer: {
     disableHostCheck: true,
     proxy: {
        "^/api": {
           target: "https://rvj6rnbpxj.execute-api.eu-central-1.amazonaws.com/prod/",
           ws: false,
           secure: false,
           cookieDomainRewrite: "",
           cookiePathRewrite: "/",
           changeOrigin: true,
           withCredentials: true,
           pathRewrite: {
              "^/api": ""
           }
        }
     }
  },
}
