const juice = require("juice");
const fs = require("fs");
const path = require("path");
const bibtexParse = require("bibtex-parse");

module.exports = function (eleventyConfig) {
  
  // SEO: Generate XML Sitemap
  eleventyConfig.addCollection("sitemap", function(collectionApi) {
    return collectionApi.getAll().filter(item => {
      // Only include pages that should be in sitemap
      return item.data.permalink !== false && !item.data.draft;
    });
  });
  
  // SEO: Add sitemap template
  eleventyConfig.addGlobalData("build", {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
  // Filter to abbreviate author list (first author et al.)
  eleventyConfig.addFilter("abbreviateAuthors", function(authorString) {
    if (!authorString) return "";
    
    // Clean up whitespace and newlines
    const cleanedString = authorString.replace(/\s+/g, ' ').trim();
    
    // Split by "and" to get individual authors
    const authors = cleanedString.split(" and ").map(a => a.trim()).filter(a => a.length > 0);
    
    if (authors.length === 0) return "";
    if (authors.length === 1) {
      return authors[0];
    } else if (authors.length === 2) {
      return `${authors[0]} and ${authors[1]}`;
    } else {
      // Get first author's last name
      const firstAuthor = authors[0];
      
      // Check if format is "Last, First" or "First Last"
      if (firstAuthor.includes(",")) {
        // Format: "Last, First" - take the part before comma
        const lastName = firstAuthor.split(",")[0].trim();
        return `${lastName} et al.`;
      } else {
        // Format: "First Last" or "First Middle Last" - take the last word
        const nameParts = firstAuthor.trim().split(/\s+/);
        const lastName = nameParts[nameParts.length - 1];
        return `${lastName} et al.`;
      }
    }
  });

  // Filter to abbreviate conference/journal names
  eleventyConfig.addFilter("abbreviateVenue", function(venueString) {
    if (!venueString) return "";
    
    // Check for arXiv first
    if (venueString.toLowerCase().includes('arxiv') || venueString.toLowerCase().includes('corr')) {
      return 'arXiv';
    }
    
    // Common conference/journal abbreviations
    const abbreviations = {
      'International Conference on Learning Representations': 'ICLR',
      'International Conference on Machine Learning': 'ICML',
      'Conference on Neural Information Processing Systems': 'NeurIPS',
      'Computer Vision and Pattern Recognition': 'CVPR',
      'International Conference on Computer Vision': 'ICCV',
      'European Conference on Computer Vision': 'ECCV',
      'Association for Computational Linguistics': 'ACL',
      'Empirical Methods in Natural Language Processing': 'EMNLP',
      'Winter Conference on Applications of Computer Vision': 'WACV',
      'AAAI Conference on Artificial Intelligence': 'AAAI',
    };
    
    // Try to match known conferences
    for (const [fullName, abbrev] of Object.entries(abbreviations)) {
      if (venueString.includes(fullName)) {
        return abbrev;
      }
    }
    
    // Try to extract common patterns like "ICLR 2024" or "{ICLR}"
    const conferenceMatch = venueString.match(/\b(ICLR|ICML|NeurIPS|CVPR|ICCV|ECCV|ACL|EMNLP|WACV|AAAI)\b/i);
    if (conferenceMatch) {
      return conferenceMatch[1].toUpperCase();
    }
    
    // If it's short already (less than 30 chars), return as is
    if (venueString.length < 30) {
      return venueString;
    }
    
    // Otherwise, just take the first significant words
    const words = venueString.split(/[,\-:]/)[0].trim();
    return words.length < 50 ? words : venueString.substring(0, 50) + '...';
  });

  eleventyConfig.addTransform("inline-css", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      const cssPath = path.resolve("dist/styles.css");

      let css = "";
      if (fs.existsSync(cssPath)) {
        css = fs.readFileSync(cssPath, "utf8");
        // Remove the link tag pointing to styles.css (allow attributes in any order)
        // e.g. <link rel="stylesheet" href="/styles.css"> or with other attributes
        content = content.replace(
          /<link\b[^>]*\bhref=(['"])\/?styles\.css\1[^>]*>/i,
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
    return getBibEntriesOfType(["article", "inproceedings"]);
  });

  eleventyConfig.addCollection("books", function () {
    return getBibEntriesOfType(["book"]);
  });

  eleventyConfig.addCollection("articles", function () {
    // You can define this however you want: blog posts, misc web things, etc.
    return getBibEntriesOfType(["misc", "online"]); // or maybe "online", depending on your .bib
  });

  function getBibEntriesOfType(types) {
    const bibPath = path.resolve("src/assets/bibliography.bib");

    try {
      if (!fs.existsSync(bibPath)) {
        console.warn(`[bib-preprocessor] .bib file not found at ${bibPath}`);
        return [];
      }

      const bibContent = fs.readFileSync(bibPath, "utf8");
      const entries = bibtexParse.entries(bibContent);

      if (!Array.isArray(entries)) {
        throw new Error("Parsed BibTeX content is not an array.");
      }

      const parsed = entries.map((entry) => {
        return {
          type: entry.type,
          id: entry.key,
          title: entry.TITLE,
          year: parseInt(entry.YEAR, 10),
          author: entry.AUTHOR,
          journal: entry.JOURNAL,
          booktitle: entry.BOOKTITLE,
          url: entry.URL,
          note: entry.NOTE,
          section: entry.SECTION || "Other" // <--- fallback here
        };
      });

      // Support both single type (string) and multiple types (array)
      const typeArray = Array.isArray(types) ? types : [types];
      
      return parsed
        .filter((entry) => typeArray.includes(entry.type))
        .reverse()
    } catch (err) {
      console.error(`Error parsing bibliography for types "${types}":`, err);
      return [];
    }
  }

  // Copy favicon and images to output
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/IMG_1501.webp");
  
  // Copy SEO files to root
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");

  return {
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
