const juice = require("juice");
const fs = require("fs");
const path = require("path");
const bibtexParse = require("bibtex-parse-js");

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

  eleventyConfig.addCollection("papers", function () {
    return getBibEntriesOfType("article");
  });

  eleventyConfig.addCollection("books", function () {
    return getBibEntriesOfType("book");
  });

  eleventyConfig.addCollection("articles", function () {
    // You can define this however you want: blog posts, misc web things, etc.
    return getBibEntriesOfType("misc"); // or maybe "online", depending on your .bib
  });

  function getBibEntriesOfType(type) {
    const bibPath = path.resolve("src/assets/bibliography.bib");

    try {
      if (!fs.existsSync(bibPath)) {
        console.warn(`[bib-preprocessor] .bib file not found at ${bibPath}`);
        return [];
      }

      const bibContent = fs.readFileSync(bibPath, "utf8");
      const entries = bibtexParse.toJSON(bibContent);

      if (!Array.isArray(entries)) {
        throw new Error("Parsed BibTeX content is not an array.");
      }

      const parsed = entries.map((entry) => {
        const fields = entry.entryTags || {};
        return {
          type: entry.entryType,
          id: entry.citationKey,
          title: fields.title,
          year: parseInt(fields.year, 10),
          author: fields.author,
          journal: fields.journal,
          booktitle: fields.booktitle,
          url: fields.url,
          note: fields.note,
          section: fields.section || "Other" // <--- fallback here
        };
      });

      return parsed
        .filter((entry) => entry.type === type)
        .reverse()
    } catch (err) {
      console.error(`Error parsing bibliography for type "${type}":`, err);
      return [];
    }
  }

  return {
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
