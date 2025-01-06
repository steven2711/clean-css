const fs = require('fs');
const path = require('path');

module.exports = (options) => {
  const { outputDir } = options;
  return {
    postcssPlugin: 'postcss-extract-branding',
    Once(root) {
      let brandingCSS = '';
      let structuralCSS = '';

      root.walkRules(rule => {
        let brandingRule = '';
        let structuralRule = '';

        rule.walkDecls(decl => {
          if (isBrandingProperty(decl.prop)) {
            brandingRule += `  ${decl.toString()}\n`;
          } else {
            structuralRule += `  ${decl.toString()}\n`;
          }
        });

        if (brandingRule) {
          brandingCSS += `${rule.selector} {\n${brandingRule}}\n`;
        }

        if (structuralRule) {
          structuralCSS += `${rule.selector} {\n${structuralRule}}\n`;
        }
      });

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write branding and structural CSS to files
      fs.writeFileSync(path.join(outputDir, 'branding.css'), brandingCSS);
      fs.writeFileSync(path.join(outputDir, 'standard.css'), structuralCSS);

      console.log('Branding and structural CSS separated successfully.');
    }
  };
};

module.exports.postcss = true;

function isBrandingProperty(prop) {
  const brandingProps = [
    'color', 'background-color', 'border-color', 'font-family', 'font-size', 'font-weight'
  ];
  return brandingProps.includes(prop);
}
