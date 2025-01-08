const { exec } = require('child_process');

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

module.exports = { runPostCSS };
