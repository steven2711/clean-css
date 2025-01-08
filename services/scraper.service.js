const fs = require('fs');
const path = require('path');

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
        const filePath = path.join(__dirname, '..', 'pages', 'searchListing.html');
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
      const filePath = path.join(__dirname, '..', 'pages', 'propertyDetail.html');
      savePageContent(filePath, content);
      console.log(`Saved to ${filePath}`);
    }
}

async function handleCheckoutPage(page) {
    const content = await page.content();
  
    if (content) {
      const filePath = path.join(__dirname, '..', 'pages', 'checkout.html');
      savePageContent(filePath, content);
      console.log(`Saved to ${filePath}`);
    }
}

async function goThroughTheFunnel(page, sessionParam, baseUrl) {
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
  
    
    await handleSearchListingPage(page);
  
    // go to property detail
    await page.evaluate(() => {
      document.querySelector('.ArnPropNameLink:first-of-type').click();
    });
  
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
   
    await handlePropertyDetailPage(page);
  
    // go to checkout
    // TODO:
    // there's a chance were the room may be unavailable
    // if so, we need to go back to the property detail page and try again

    await page.evaluate(() => {
      document.querySelector('.bookRoom:first-of-type').click();
    });
  
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await handleCheckoutPage(page);
}

module.exports = { goThroughTheFunnel, savePageContent };
