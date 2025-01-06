const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Read configuration from JSON file
const configPath = 'data.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const {
  baseUrl,
  loginUrl,
  username,
  password,
  siteid,
  arnPages,
  arnParamPages,
  staticPages,
  errorPages,
  useRegistrationFlow,
  newUserEmail,
  newUserPassword,
  firstName,
  lastName,
} = config;

const themesPath = path.join(
  process.env.HOME,
  `Sites/appSkins/${siteid}/v6/themes/standard`
);

// Function to update staticPages array
function updatePagesArray() {
  // Clear the arrays first
  staticPages.length = 0;
  errorPages.length = 0;

  const files = fs.readdirSync(themesPath);
  files.forEach((file) => {
    if (file.startsWith('static-')) {
      const pagePath = file.replace('static-', '/').replace('.html', '');
      if (!staticPages.includes(pagePath)) {
        staticPages.push(pagePath);
      }
    }
  });

  // Write the updated config back to the JSON file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function runPostCSS() {
  exec('npm run purgecss', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running purgecss: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
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

async function savePageContent(filePath, content) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  fs.writeFileSync(filePath, content, 'utf8');
}

async function handleSearchListingPage(page) {
  await page.waitForFunction(
    () => {
      // Replace the following with the actual condition to check if polling has stopped
      const pollingIndicator = document.querySelector('#searching');
      return pollingIndicator.style.display === 'none';
    },
    { timeout: 60000 }
  );

  const content = await page.content();

  if (content) {
    const filePath = path.join(__dirname, 'pages', 'searchListing.html');
    savePageContent(filePath, content);
    console.log(`Saved to ${filePath}`);
  }
}

async function handlePropertyDetailPage(page) {
  await page.waitForFunction(
    () => {
      const pollingIndicator = document.querySelector('#standardAvail');
      return pollingIndicator;
    },
    { timeout: 60000 }
  );

  const content = await page.content();

  if (content) {
    const filePath = path.join(__dirname, 'pages', 'propertyDetail.html');
    savePageContent(filePath, content);
    console.log(`Saved to ${filePath}`);
  }
}

async function handleCheckoutPage(page) {
  const content = await page.content();

  if (content) {
    const filePath = path.join(__dirname, 'pages', 'checkout.html');
    savePageContent(filePath, content);
    console.log(`Saved to ${filePath}`);
  }
}

async function handleRegistrationFlow(page) {
  // needs more work
  const content = await page.content();

  if (content) {
    const filePath = path.join(__dirname, 'pages', '.html');
    savePageContent(filePath, content);
    console.log(`Saved to ${filePath}`);
  }
}

async function goThroughTheFunnel(page, sessionParam) {
  await page.goto(`${baseUrl}/v6?type=hotellist&_s=${sessionParam}`, {
    waitUntil: 'networkidle2',
  });

  const searchLink = await page.evaluate(() => {
    const linkElement = document.querySelector(
      '.destinationThumb:first-of-type a'
    );
    return linkElement ? linkElement.href : null;
  });

  // go to search listing
  await page.goto(searchLink, { waitUntil: 'networkidle2' });

  // grab search listing content
  await handleSearchListingPage(page);

  // go to property detail

  await page.evaluate(() => {
    document.querySelector('.ArnPropNameLink:first-of-type').click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // grab property detail content
  await handlePropertyDetailPage(page);

  // got to checkout

  await page.evaluate(() => {
    document.querySelector('.bookRoom:first-of-type').click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // grab checkout content

  await handleCheckoutPage(page);
}

async function scrapePages() {
  updatePagesArray();

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Log in
  await page.goto(`${loginUrl}?siteid=${siteid}`, {
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

  // arn native pages
  for (const pagePath of arnPages) {
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

  await goThroughTheFunnel(page, sessionParam);

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

scrapePages();
