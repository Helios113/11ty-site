const juice = require("juice");
const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("inline-css", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      // Match all <link rel="stylesheet" href="..."> tags
      const linkTagRegex =
        /<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/gi;

      let combinedCSS = "";

      // Replace each link tag with nothing (we’ll inline instead)
      content = await content.replace(linkTagRegex, (match, href) => {
        // Resolve the path to the CSS file
        const cssPath = path.resolve("dist", href); // adjust "dist" if your output dir differs
        if (fs.existsSync(cssPath)) {
          const css = fs.readFileSync(cssPath, "utf-8");
          combinedCSS += css + "\n";
        } else {
          console.warn(`[inline-css] Warning: CSS file not found: ${cssPath}`);
        }
        return ""; // Remove the link tag — we’ll inline the styles
      });

      // Inject combined styles into a <style> tag in the <head>
      content = content.replace(
        /<\/head>/i,
        `<style>${combinedCSS}</style>\n</head>`,
      );

      // Inline the styles
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
