const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

async function generatePDF() {
  try {
    // Read the markdown file
    const markdownPath = path.join(__dirname, 'MPRIMO_API_Documentation.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert markdown to HTML
    const htmlContent = marked(markdownContent);
    
    // Create full HTML document with styling
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MPRIMO API Documentation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
          page-break-before: always;
        }
        
        h1:first-child {
          page-break-before: auto;
        }
        
        h2 {
          color: #34495e;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 5px;
          margin-top: 30px;
        }
        
        h3 {
          color: #2980b9;
          margin-top: 25px;
        }
        
        h4 {
          color: #8e44ad;
          margin-top: 20px;
        }
        
        code {
          background-color: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }
        
        pre {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 5px;
          padding: 15px;
          overflow-x: auto;
          margin: 15px 0;
        }
        
        pre code {
          background: none;
          padding: 0;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .endpoint {
          background-color: #e8f5e8;
          padding: 10px;
          border-left: 4px solid #28a745;
          margin: 10px 0;
        }
        
        .method-get { color: #28a745; font-weight: bold; }
        .method-post { color: #007bff; font-weight: bold; }
        .method-put { color: #ffc107; font-weight: bold; }
        .method-patch { color: #17a2b8; font-weight: bold; }
        .method-delete { color: #dc3545; font-weight: bold; }
        
        ul {
          padding-left: 20px;
        }
        
        li {
          margin: 5px 0;
        }
        
        .toc {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        
        .toc ul {
          list-style-type: none;
          padding-left: 0;
        }
        
        .toc li {
          margin: 8px 0;
        }
        
        .toc a {
          text-decoration: none;
          color: #007bff;
        }
        
        .toc a:hover {
          text-decoration: underline;
        }
        
        @media print {
          body {
            font-size: 12px;
          }
          
          h1 {
            page-break-before: always;
          }
          
          h1:first-child {
            page-break-before: auto;
          }
          
          pre {
            page-break-inside: avoid;
          }
          
          .endpoint {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
    `;
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new'
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'MPRIMO_API_Documentation.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          MPRIMO API Documentation
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });
    
    await browser.close();
    
    console.log(`✅ PDF generated successfully: ${pdfPath}`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  }
}

// Run the function
generatePDF();