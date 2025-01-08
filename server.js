const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { runPostCSS } = require('./services/css.service');
const { goThroughTheFunnel, savePageContent } = require('./services/scraper.service');


const configPath = 'data.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const {
  baseUrl,
  username,
  password,
  siteid,
  arnAdminPages,
  arnParamPages,
  staticPages,
  errorPages,
} = config;

// You may need to adjust path based on your environment
const themesPath = path.join(
  process.env.HOME,
  `Sites/appSkins/${siteid}/v6/themes/standard`
);

function getStaticPages() {
  staticPages.length = 0;
  errorPages.length = 0;

  const files = fs.readdirSync(themesPath);
  files.forEach((file) => {
    if (file.startsWith('static-')) {
      const pagePath = file.replace('static-', '/').replace('.html', '');
      if (!staticPages.includes(pagePath) && !pagePath.includes("redirect")) {
        staticPages.push(pagePath);
      }
    }
  });

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}


async function fetchPageContent(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    return await page.content();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    // Add the full URL to errorPages array
    if (!errorPages.includes(url)) {
      errorPages.push(url);
      // Write the updated config back to the JSON file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }
    return null;
  }
}


async function main() {
  getStaticPages();

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Register
  await page.goto(`${baseUrl}/v6/register?siteid=${siteid}`, {
    waitUntil: 'networkidle2',
  });


  const registerContent = await page.content();

  if (registerContent) {
    const fileName = 'register';
    const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
    savePageContent(filePath, registerContent);
    console.log(`Saved ${fileName} to ${filePath}`);
  }

  // Log in
  await page.goto(`${baseUrl}/v6/login?siteid=${siteid}`, {
    waitUntil: 'networkidle2',
  });

  // Handle Cookie banner
  await page.waitForSelector('#onetrust-accept-btn-handler');
  await page.click('#onetrust-accept-btn-handler');

  const content = await page.content();

  if (content) {
    const fileName = 'login';
    const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
    savePageContent(filePath, content);
    console.log(`Saved ${fileName} to ${filePath}`);
  }

  await page.type('#theUserNameAjax input', username);
  await page.type('#thePasswordAjax input', password);

  await page.evaluate(() => {
    document.querySelector('input.LoginAction').click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  const currentUrl = page.url();
  const url = new URL(currentUrl);
  const sessionParam = url.searchParams.get('_s');

  // arn admin pages
  for (const pagePath of arnAdminPages) {
    const url = `${baseUrl}/v6${pagePath}?_s=${sessionParam}`;
    const content = await fetchPageContent(page, url);

    if (content) {
      const fileName =
        pagePath.replace(/\/$/, '').replace(/\//g, '') || 'index';
      const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
      savePageContent(filePath, content);
      console.log(`Saved ${url} to ${filePath}`);
    }
  }

  // arn native param pages
  for (const pagePath of arnParamPages) {
    const url = `${baseUrl}/v6?${pagePath}&_s=${sessionParam}`;
    const content = await fetchPageContent(page, url);

    if (content) {
      const fileName =
        pagePath.replace(/\/$/, '').replace(/\//g, '') || 'index';
      const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
      savePageContent(filePath, content);
      console.log(`Saved ${url} to ${filePath}`);
    }
  }

  await goThroughTheFunnel(page, sessionParam, baseUrl);

  // get staticPages HTML
  for (const pagePath of staticPages) {
    const url = `${baseUrl}/v6${pagePath}?siteid=${siteid}`;
    const content = await fetchPageContent(page, url);

    if (content) {
      const fileName =
        pagePath.replace(/\/$/, '').replace(/\//g, '') || 'index';
      const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
      savePageContent(filePath, content);
      console.log(`Saved ${url} to ${filePath}`);
    }
  }

  // retry error static
  for (const pagePath of errorPages) {
    const content = await fetchPageContent(pagePath, url);

    if (content) {
      const fileName =
        pagePath.replace(/\/$/, '').replace(/\//g, '') || 'index';
      const filePath = path.join(__dirname, 'pages', `${fileName}.html`);
      savePageContent(filePath, content);
      console.log(`Saved ${url} to ${filePath}`);
    }
  }

  await browser.close();

  await runPostCSS();
}

main();
