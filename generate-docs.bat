@echo off
echo Installing dependencies for PDF generation...
npm install --package-lock-only=false puppeteer@21.0.0 marked@9.0.0

echo.
echo Generating PDF documentation...
node generate-pdf-docs.js

echo.
echo Done! Check MPRIMO_API_Documentation.pdf
pause