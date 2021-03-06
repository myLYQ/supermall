module.exports = {

  publicPath:'./',
  configureWebpack: {
    resolve: {
      extensions: [".js", ".css", ".sass", ".less"],
      alias: {
        assets: "@/assets",
        common: "@/common",
        components: "@/components",
        network: "@/network",
        views: "@/views",
        store: "@/store"
      }
    }
  },
};
