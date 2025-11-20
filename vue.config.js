const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const JavaScriptObfuscator = require("javascript-obfuscator");

const isProd = process.env.NODE_ENV === "production";
const enableConfigJS = process.env.VUE_APP_CONFIGJS == "true";
const enableObfuscation = process.env.VUE_APP_OBFUSCATION == "true";

let extraScriptFileName = '';
const generateRandomFileName = (length = 8) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let name = "";
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const randowNumber = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `${randowNumber}.${name}.js`;
};

if (isProd && enableConfigJS) {
  extraScriptFileName = generateRandomFileName();
}

module.exports = defineConfig({
  publicPath: "./",
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: false,
  productionSourceMap: false,

  transpileDependencies: [
    '@vueuse/motion'
  ],
  
  configureWebpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, syncWebAssembly: true };
    config.resolve = { 
      ...config.resolve, 
      alias: { 
        "@": path.resolve(__dirname, "src"),
        // 强制指向 CommonJS 版本，彻底避开 import.meta 报错
        '@vueuse/motion$': path.resolve(__dirname, 'node_modules/@vueuse/motion/dist/index.cjs')
      } 
    };
    
    config.plugins.push(
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      })
    );
    
    if (isProd && enableConfigJS) {
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("GenerateExtraConfigPlugin", () => {
            const configPath = path.resolve(__dirname, "src/config/index.js");
            const distPath = path.resolve(compiler.options.output.path, extraScriptFileName);
            
            try {
              let content = fs.readFileSync(configPath, "utf-8");
              content = content.replace(/window\.EZ_CONFIG\s*=\s*config\s*;?/g, "");
              content = content.replace(/export\s+const\s+config\s*=/, "window.EZ_CONFIG =");
              
              const obfuscated = JavaScriptObfuscator.obfuscate(content, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                numbersToExpressions: true,
                simplify: true,
                stringArray: true,
                stringArrayEncoding: ["rc4"],
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: true
              }).getObfuscatedCode();
              
              const fileContent = enableObfuscation ? obfuscated : content;
              
              // 写入 dist
              fs.writeFileSync(distPath, fileContent, "utf-8");
              
              console.log(`生成混淆独立 JS 文件: ${extraScriptFileName}`);
            } catch (err) {
              console.warn("生成独立 JS 文件失败:", err);
            }
          });
        },
      });
    }
    
    if (isProd) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: { name: "chunk-vendors", test: /[\\/]node_modules[\\/]/, priority: -10, chunks: "initial" },
            common: { name: "chunk-common", minChunks: 2, priority: -20, chunks: "initial", reuseExistingChunk: true },
          },
        },
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: { compress: { drop_console: true, drop_debugger: true }, mangle: true, format: { comments: false, ascii_only: true } },
            extractComments: false,
          }),
        ],
      };
    }
  },
  
  chainWebpack: (config) => {
    if (isProd) {
      const pluginName = "html-index";
      config.plugin(pluginName).tap((args) => {
        args[0].templateParameters = {
          ...args[0].templateParameters,
          injectCustomScript: `
            ${enableConfigJS ? `<script src="./${extraScriptFileName}"></script>` : ""}
          `,
        };
        return args;
      });
    }
  },
  
  css: {
    loaderOptions: {
      sass: {
        implementation: require("sass"),
        sassOptions: { outputStyle: "expanded", fiber: false, indentedSyntax: false, includePaths: ["node_modules"] },
        additionalData: `@use "@/assets/styles/base/variables.scss" as *;`,
      },
    },
  },
  
  pages: {
    index: { entry: "src/main.js", template: "public/index.html", filename: "index.html", title: process.env.VUE_APP_TITLE },
  },
  
  devServer: { client: { overlay: false } },
});
