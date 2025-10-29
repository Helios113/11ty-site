#!/usr/bin/env node

/**
 * Update bibliography venues from DBLP
 * 
 * This script reads bibliography.bib, queries DBLP for each paper,
 * and updates the venue information (booktitle/journal) with
 * standardized conference/journal names from DBLP.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BIB_PATH = path.resolve(__dirname, '../src/assets/bibliography.bib');
const DBLP_API_BASE = 'https://dblp.org/search/publ/api';

/**
 * Query DBLP API for a paper by title
 */
async function queryDblp(title) {
  const query = encodeURIComponent(title);
  const url = `${DBLP_API_BASE}?q=${query}&format=json&h=5`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extract venue from DBLP result
 */
function extractVenue(hit) {
  if (!hit.info) return null;
  
  const info = hit.info;
  
  // For conference papers
  if (info.venue && info.type === 'Conference and Workshop Papers') {
    return {
      type: 'conference',
      venue: info.venue,
      year: info.year
    };
  }
  
  // For journal articles
  if (info.venue && info.type === 'Journal Articles') {
    return {
      type: 'journal',
      venue: info.venue,
      year: info.year
    };
  }
  
  // Fallback to venue if available
  if (info.venue) {
    return {
      type: 'unknown',
      venue: info.venue,
      year: info.year
    };
  }
  
  return null;
}

/**
 * Find best matching result from DBLP
 */
function findBestMatch(results, originalTitle) {
  if (!results || !results.result || !results.result.hits || !results.result.hits.hit) {
    return null;
  }
  
  const hits = Array.isArray(results.result.hits.hit) 
    ? results.result.hits.hit 
    : [results.result.hits.hit];
  
  // Simple match: first result with similar title
  const titleLower = originalTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  for (const hit of hits) {
    if (!hit.info || !hit.info.title) continue;
    
    const hitTitle = hit.info.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    // Check if titles are very similar (simple substring match)
    if (titleLower.includes(hitTitle) || hitTitle.includes(titleLower)) {
      return hit;
    }
  }
  
  // If no exact match, return first result
  return hits[0];
}

/**
 * Parse BibTeX file into entries (simple regex-based parser)
 */
function parseBibFile(content) {
  const entries = [];
  const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]*?)\n\}/g;
  
  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const [fullMatch, type, key, fields] = match;
    
    // Extract title
    const titleMatch = fields.match(/title\s*=\s*\{([^}]+)\}/);
    const title = titleMatch ? titleMatch[1] : null;
    
    // Extract year
    const yearMatch = fields.match(/year\s*=\s*\{([^}]+)\}/);
    const year = yearMatch ? yearMatch[1] : null;
    
    entries.push({
      fullMatch,
      type,
      key,
      title,
      year,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length
    });
  }
  
  return entries;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('Reading bibliography file...');
  
  if (!fs.existsSync(BIB_PATH)) {
    console.error(`Error: Bibliography file not found at ${BIB_PATH}`);
    process.exit(1);
  }
  
  let bibContent = fs.readFileSync(BIB_PATH, 'utf8');
  const entries = parseBibFile(bibContent);
  
  console.log(`Found ${entries.length} entries in bibliography\n`);
  
  const updates = [];
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    if (!entry.title) {
      console.log(`[${i + 1}/${entries.length}] ${entry.key}: No title found, skipping`);
      continue;
    }
    
    console.log(`[${i + 1}/${entries.length}] Querying DBLP for: "${entry.title.substring(0, 60)}..."`);
    
    try {
      const results = await queryDblp(entry.title);
      const bestMatch = findBestMatch(results, entry.title);
      
      if (bestMatch) {
        const venueInfo = extractVenue(bestMatch);
        
        if (venueInfo) {
          console.log(`  ✓ Found: ${venueInfo.venue} (${venueInfo.type}) ${venueInfo.year}`);
          updates.push({
            entry,
            venueInfo
          });
        } else {
          console.log(`  ⚠ No venue info found`);
        }
      } else {
        console.log(`  ✗ No match found`);
      }
      
      // Rate limiting: wait 500ms between requests
      await sleep(500);
      
    } catch (err) {
      console.error(`  ✗ Error querying DBLP: ${err.message}`);
    }
  }
  
  console.log(`\n\nSummary:`);
  console.log(`  Total entries: ${entries.length}`);
  console.log(`  Venues found: ${updates.length}`);
  console.log(`  Missing: ${entries.length - updates.length}`);
  
  if (updates.length > 0) {
    console.log('\n📋 Venue updates:\n');
    updates.forEach(({ entry, venueInfo }) => {
      console.log(`${entry.key}:`);
      console.log(`  ${venueInfo.venue} (${venueInfo.year})`);
    });
  }
  
  console.log('\n✅ Done! Review the output above to see what venues were found.');
  console.log('Note: This script currently only displays findings.');
  console.log('To apply updates to the .bib file, you can extend the script or manually update entries.');
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
