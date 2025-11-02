#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'assets', 'cv.tex');
const outputPath = path.join(__dirname, '..', 'src', 'pages', 'CV.md');
const distPath = path.join(__dirname, '..', 'dist', 'assets');
const pdfPath = path.join(distPath, 'cv.pdf');

function cleanLatexText(text) {
  return text
    .replace(/\\&/g, '&')           // Escaped ampersand
    .replace(/\\textbf\{(.+?)\}/g, '<strong>$1</strong>')  // Bold text
    .replace(/\\textit\{(.+?)\}/g, '<em>$1</em>')          // Italic text
    .replace(/\\href\{(.+?)\}\{(.+?)\}/g, '<a href="$1" target="_blank">$2</a>') // Links
    .replace(/\\\\$/g, '')          // Line breaks at end
    .replace(/\\\\/g, '<br>')       // Line breaks
    .replace(/~/g, ' ')             // Non-breaking spaces
    .trim();
}

function parseLatexCV(texContent) {
  let html = '';
  
  // Extract name from header
  const nameMatch = texContent.match(/\\Huge\\bfseries\s+(.+?)\}/);
  const name = nameMatch ? cleanLatexText(nameMatch[1]) : 'CV';
  
  // Extract contact info
  const emailMatch = texContent.match(/\\href\{mailto:(.+?)\}\{(.+?)\}/);
  const phoneMatch = texContent.match(/\\faPhone\\\s*(.+?)\s*\\quad/);
  const linkedinMatch = texContent.match(/\\faLinkedin\\\s*\\href\{(.+?)\}\{(.+?)\}/);
  const githubMatch = texContent.match(/\\faGithub\\\s*\\href\{(.+?)\}\{(.+?)\}/);
  const websiteMatch = texContent.match(/\\faGlobe\\\s*\\href\{(.+?)\}\{(.+?)\}/);
  const scholarMatch = texContent.match(/\\faGraduationCap\\\s*\\href\{(.+?)\}\{(.+?)\}/);

  // Header section
  html += `<header class="cv-header">\n`;
  html += `  <h1>${name}</h1>\n`;
  html += `  <div class="contact-info">\n`;
  
  if (emailMatch) html += `    <div class="contact-item"><span class="icon">✉️</span><a href="mailto:${emailMatch[1]}">${emailMatch[1]}</a></div>\n`;
  if (phoneMatch) html += `    <div class="contact-item"><span class="icon">📱</span>${phoneMatch[1].replace(/\\quad.*/, '').trim()}</div>\n`;
  if (linkedinMatch) html += `    <div class="contact-item"><span class="icon">💼</span><a href="${linkedinMatch[1]}" target="_blank">${linkedinMatch[2]}</a></div>\n`;
  if (githubMatch) html += `    <div class="contact-item"><span class="icon">🐙</span><a href="${githubMatch[1]}" target="_blank">${githubMatch[2]}</a></div>\n`;
  if (websiteMatch) html += `    <div class="contact-item"><span class="icon">🌐</span><a href="${websiteMatch[1]}" target="_blank">${websiteMatch[2]}</a></div>\n`;
  if (scholarMatch) html += `    <div class="contact-item"><span class="icon">🎓</span><a href="${scholarMatch[1]}" target="_blank">${scholarMatch[2]}</a></div>\n`;
  
  html += `  </div>\n`;
  html += `</header>\n\n`;

  // Parse sections
  const sections = texContent.split('\\section*{').slice(1);
  
  sections.forEach(section => {
    const lines = section.split('\n');
    const sectionTitle = cleanLatexText(lines[0].replace('}', '').trim());
    
    html += `<section class="cv-section">\n`;
    html += `  <h2>${sectionTitle}</h2>\n`;
    
    if (sectionTitle === 'Research Interests') {
      // Handle research interests as a simple paragraph
      const content = section.match(/\}(.+?)\\vspace/s);
      if (content) {
        const interests = content[1].replace(/\n/g, ' ').trim();
        html += `  <p class="research-interests">${interests}</p>\n`;
      }
    } else {
      // Parse CV items
      const cvItems = section.match(/\\cvitem\{(.+?)\}\{(.+?)\}/g);
      if (cvItems) {
        cvItems.forEach(item => {
          const itemMatch = item.match(/\\cvitem\{(.+?)\}\{(.+?)\}/);
          if (itemMatch) {
            const title = itemMatch[1];
            const date = itemMatch[2];
            
            html += `  <div class="cv-item">\n`;
            html += `    <div class="cv-item-header">\n`;
            html += `      <h3>${cleanLatexText(title)}</h3>\n`;
            html += `      <span class="date">${cleanLatexText(date)}</span>\n`;
            html += `    </div>\n`;
            
            // Look for subtitle
            const subtitleRegex = new RegExp(`\\\\cvitem\\{${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\{${date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}.*?\\\\cvsubitem\\{(.+?)\\}\\{(.+?)\\}`, 's');
            const subtitleMatch = section.match(subtitleRegex);
            if (subtitleMatch) {
              html += `    <div class="cv-subtitle">${cleanLatexText(subtitleMatch[2])} | ${cleanLatexText(subtitleMatch[1])}</div>\n`;
            }
            
            // Look for bullet points
            const itemSection = section.substring(section.indexOf(item));
            const bulletMatch = itemSection.match(/\\begin\{itemize\}(.+?)\\end\{itemize\}/s);
            if (bulletMatch) {
              html += `    <ul>\n`;
              const bullets = bulletMatch[1].match(/\\item\s+(.+?)(?=\\item|\s*\\end)/gs);
              if (bullets) {
                bullets.forEach(bullet => {
                  const bulletText = cleanLatexText(bullet.replace(/\\item\s+/, '').trim());
                  html += `      <li>${bulletText}</li>\n`;
                });
              }
              html += `    </ul>\n`;
            }
            
            html += `  </div>\n`;
          }
        });
      } else {
        // Handle simple bullet lists
        const bulletMatch = section.match(/\\begin\{itemize\}(.+?)\\end\{itemize\}/s);
        if (bulletMatch) {
          html += `  <ul>\n`;
          const bullets = bulletMatch[1].match(/\\item\s+(.+?)(?=\\item|\s*\\end)/gs);
          if (bullets) {
            bullets.forEach(bullet => {
              const bulletText = cleanLatexText(bullet.replace(/\\item\s+/, '').trim());
              html += `    <li>${bulletText}</li>\n`;
            });
          }
          html += `  </ul>\n`;
        } else {
          // Handle skills section specially
          if (sectionTitle === 'Technical Skills') {
            const skillsContent = section.substring(section.indexOf('}') + 1);
            const skillLines = skillsContent.split('\\\\').filter(line => line.trim());
            skillLines.forEach(line => {
              const skillMatch = line.match(/\\textbf\{(.+?)\}:\s*(.+)/);
              if (skillMatch) {
                html += `  <div class="skill-category">\n`;
                html += `    <strong>${cleanLatexText(skillMatch[1])}:</strong> ${cleanLatexText(skillMatch[2].trim())}\n`;
                html += `  </div>\n`;
              }
            });
          }
        }
      }
    }
    
    html += `</section>\n\n`;
  });

  return html;
}

function compilePDF() {
  // Ensure dist/assets directory exists
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }

  // Check if we're in a CI environment (Cloudflare Pages)
  const isCI = process.env.CF_PAGES || process.env.CI || process.env.NODE_ENV === 'production';
  const precompiledPdfPath = path.join(__dirname, '..', 'src', 'assets', 'cv-precompiled.pdf');
  
  if (isCI) {
    console.log('🔧 Running in CI environment');
    
    // In CI, check for a precompiled PDF first
    if (fs.existsSync(precompiledPdfPath)) {
      fs.copyFileSync(precompiledPdfPath, pdfPath);
      console.log('✅ Using precompiled PDF for CI deployment');
      return true;
    } else {
      console.warn('⚠️  No precompiled PDF found. PDF download will not be available.');
      console.warn('   Run "npm run build:cv" locally to generate a precompiled PDF.');
      return false;
    }
  }

  // For local development, try to compile with LaTeX
  try {
    // Check if pdflatex is available
    execSync('which pdflatex', { stdio: 'pipe' });
  } catch (error) {
    console.warn('⚠️  pdflatex not found. Install LaTeX to compile CV to PDF.');
    console.warn('   On macOS: brew install --cask mactex-no-gui');
    console.warn('   On Ubuntu: sudo apt-get install texlive-latex-base texlive-fonts-recommended');
    
    // Check for precompiled version as fallback
    if (fs.existsSync(precompiledPdfPath)) {
      fs.copyFileSync(precompiledPdfPath, pdfPath);
      console.log('✅ Using precompiled PDF as fallback');
      return true;
    }
    return false;
  }

  try {
    // Compile LaTeX to PDF
    const tempDir = path.join(__dirname, '..', 'temp-latex');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy tex file to temp directory
    const tempTexPath = path.join(tempDir, 'cv.tex');
    fs.copyFileSync(srcPath, tempTexPath);

    // Compile PDF (run twice for proper references)
    console.log('📄 Compiling LaTeX to PDF...');
    execSync(`cd "${tempDir}" && pdflatex -interaction=nonstopmode cv.tex && pdflatex -interaction=nonstopmode cv.tex`, { stdio: 'pipe' });
    
    // Copy PDF to dist
    const tempPdfPath = path.join(tempDir, 'cv.pdf');
    if (fs.existsSync(tempPdfPath)) {
      fs.copyFileSync(tempPdfPath, pdfPath);
      
      // Also save as precompiled version for CI builds
      fs.copyFileSync(tempPdfPath, precompiledPdfPath);
      
      console.log('✅ CV compiled successfully to PDF');
      console.log('✅ Precompiled PDF saved for CI deployment');
    }

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    return true;

  } catch (error) {
    console.error('❌ Error compiling PDF:', error.message);
    console.warn('   Continuing with HTML-only version...');
    
    // Try precompiled version as fallback
    if (fs.existsSync(precompiledPdfPath)) {
      fs.copyFileSync(precompiledPdfPath, pdfPath);
      console.log('✅ Using precompiled PDF as fallback');
      return true;
    }
    return false;
  }
}

try {
  console.log('Converting LaTeX CV to HTML...');
  
  const texContent = fs.readFileSync(srcPath, 'utf8');
  const htmlContent = parseLatexCV(texContent);
  
  // Compile PDF
  const pdfCompiled = compilePDF();
  
  const frontMatter = `---
title: CV
layout: page.njk
eleventyNavigation:
  order: 2
---

<div class="cv-container">
  ${pdfCompiled ? '<div class="cv-download-section">\n    <a href="/assets/cv.pdf" class="cv-download-btn" target="_blank" download>\n      📄 Download as PDF\n    </a>\n  </div>' : ''}
${htmlContent}</div>
`;

  fs.writeFileSync(outputPath, frontMatter);
  console.log('✅ CV converted successfully to HTML');

} catch (error) {
  console.error('❌ Error converting CV:', error.message);
}