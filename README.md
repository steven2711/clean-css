# Get-HTML: Website Content Scraper for ARN Sites 🌐

A Node.js-based web scraping tool designed specifically for ARN (AllResNet) general websites. This tool automates the process of extracting HTML content and processing CSS from various pages within the reservation funnel, with special handling for authentication flows and static pages.

## ✨ Features

- 🔐 Automated login and session handling
- 🔄 Complete reservation funnel traversal and content extraction
- 📄 Static page collection from configured paths
- 🎨 CSS processing and optimization pipeline including:
  - CSS purging for unused styles
  - Media query combination
  - Duplicate removal
  - Rule merging
  - Asset URL normalization
- ⚙️ Configurable site parameters via JSON
- 🔄 Error page tracking and retry mechanism

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- NPM (Included with Node.js)

## 🚀 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [your-repo]
```

2. Install dependencies:
```bash
npm install
```

3. Configure your environment by updating `data.json` with your site-specific information:
```json
{
  "siteid": "YOUR_SITE_ID",
  "baseUrl": "YOUR_BASE_URL",
  "username": "YOUR_USERNAME",
  "password": "YOUR_PASSWORD"
}
```

## 📖 Usage

### Basic Usage

- Download a site ID as you normally would via download scripts
- Update `data.json` with your site-specific information
- Add the CSS file you wish to process to the `css` directory
- Run the main scraping process:

```bash
npm start
```

### CSS Processing

- The tool will automatically handle the login process, traverse the reservation funnel, and save the HTML content to the `pages` directory
- The tool will also automatically process the CSS file and save the optimized CSS to the `cleaned` directory
- CSS purge rules are defined in `postcss.config.js`

## ⚙️ Configuration

The tool can be configured through `data.json` with the following options:

- `siteid`: Your ARN site identifier
- `baseUrl`: Base URL of the target website
- `username`/`password`: Login credentials
- `arnRegisterPage`: Array of ARN register pages to scrape
- `arnAdminPages`: Array of ARN admin pages to scrape
- `arnParamPages`: Array of parameter-based pages
- `staticPages`: Array of static pages (auto-populated)
- `errorPages`: Array for tracking failed page fetches

## 📁 Project Structure

```
get-html/
├── css/                  # Source CSS files
├── cleaned/             # Processed CSS output
├── pages/               # Scraped HTML output
├── server.js            # Main scraping logic
├── process-css.js       # CSS processing script
├── postcss-*.js         # PostCSS plugins
└── data.json            # Configuration file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 Development Notes

- Known TODOs:
  - 🔧 Improve error handling
  - 📊 Refactor server.js for better code organization
  - ✨ Enhanced registration flow handling
  - ✅ Add additional ARN pages to scrape

## 🧪 Testing

Currently, the project doesn't include automated tests. To manually test:

1. Configure a test site in `data.json`
2. Run the scraper: `npm start`
3. Verify output in the `pages/` directory
4. Check processed CSS in `cleaned/` directory

## 📜 License

This project is licensed under the ISC License.

## ⚠️ Assumptions and Requirements

1. The target website must use the location search component on the root search page
2. Test Mode Reservation must be enabled in TripAuthority for complete funnel traversal
3. Sites should follow the standard ARN schema - deviations may require code modifications

## 👏 Credits

This tool uses several open-source packages:
- 🤖 Puppeteer for web scraping
- 🎨 PostCSS and various plugins for CSS processing
- ⚡ Node.js standard libraries
