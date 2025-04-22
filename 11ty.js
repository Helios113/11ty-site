const bibtexParse = require("bibtex-parse-js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addCollection("bibliography", function () {
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
          author: fields.author,
          year: parseInt(fields.year, 10),
          journal: fields.journal,
          booktitle: fields.booktitle,
          url: fields.url,
          note: fields.note,
        };
      });

      return parsed.sort((a, b) => b.year - a.year);
    } catch (err) {
      console.error("Error while parsing bibliography:", err);
      return [];
    }
  });

  return {
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
