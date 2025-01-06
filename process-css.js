const postcss = require('postcss');
const fs = require('fs');
const path = require('path');
const postcssConfig = require('./postcss.config.js');
const extractBranding = require('./postcss-extract-branding');

// Get inputFilePath and outputDir from command-line arguments
const inputFilePath = process.argv[2];
const outputDir = process.argv[3];

if (!inputFilePath || !outputDir) {
  console.error('Please provide the input CSS file path and output directory as command-line arguments.');
  process.exit(1);
}

const css = fs.readFileSync(path.resolve(__dirname, inputFilePath), 'utf8');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Path for the cleaned CSS file
const cleanedCSSPath = path.resolve(outputDir, 'cleaned.css');

// Process with the regular PostCSS plugins
postcss(postcssConfig.plugins)
  .process(css, { from: inputFilePath })
  .then(result => {
    // Save the cleaned CSS
    fs.writeFileSync(cleanedCSSPath, result.css);

    // Process the cleaned CSS with the branding extractor plugin
    return postcss([extractBranding({ outputDir })])
      .process(result.css, { from: cleanedCSSPath });
  })
  .then(() => {
    console.log('CSS processing complete.');
  })
  .catch(error => console.error(error));
