const juice = require("juice");
const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("inline-css", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      const cssPath = path.resolve("dist/styles.css");

      let css = "";
      if (fs.existsSync(cssPath)) {
        css = fs.readFileSync(cssPath, "utf8");
        // Remove the link tag pointing to styles.css
        content = content.replace(
          /<link\s+rel=["']stylesheet["']\s+href=["']\/?styles\.css["']\s*\/?>/i,
          "",
        );
        // Inject the compiled CSS into a <style> block
        content = content.replace(
          /<\/head>/i,
          `<style>${css}</style>\n</head>`,
        );
      } else {
        console.warn(`[inline-css] Warning: CSS file not found: ${cssPath}`);
      }

      return juice(content);
    }

    return content;
  });

  return {
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
