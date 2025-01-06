const usePurgeCSS = process.env.USE_PURGECSS === 'true';
const extractBranding = require('./postcss-extract-branding');

module.exports = {
  plugins: [
    usePurgeCSS && require('@fullhuman/postcss-purgecss')({
      content: ['./pages/**/*.html'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    }),
    require('postcss-combine-media-query')(),
    require('postcss-discard-duplicates')(),
    require('postcss-merge-rules')(),
    require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        normalizeUrl: false,
      }],
    }),
    require('postcss-url')({
      url: asset => {
        if (!asset.url.startsWith('data:') && !asset.url.startsWith('"') && !asset.url.startsWith("'")) {
          return `"${asset.url}"`;
        }
        return asset.url;
      }
    }),
  ].filter(Boolean)
};
