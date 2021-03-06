const fs = require('fs');
const path = require('path');

let NYM_SERVER_ADDRESS = 'ECgMYfLgvm6Z57RgCqytEyuYPBwkWyL3CPHC9DDSCiBU.DnuvLQpCLmLzjTeLMBmzYFLbRDAaafrN2LxVvNYeBn5V@EQhjPpUuy4i1u87nfQMW21WiBT5mJk4dcq4ju7Vct7cB';
let NYM_CLIENT_URL = 'ws://127.0.0.1:1977';

// Cannot use app.getPath() due to context isolation
const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support/` : `${process.env.HOME}/.config/`);
const APP_DATA_PATH = path.join(appDataDir, 'nymdrive');

console.log('App Data Path: ', APP_DATA_PATH);

const configFilePath = path.join(APP_DATA_PATH, 'config.json');

if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify({
    NYM_SERVER_ADDRESS,
    NYM_CLIENT_URL,
  }, null, 2));
} else {
  const buffer = fs.readFileSync(configFilePath);
  ({ NYM_SERVER_ADDRESS, NYM_CLIENT_URL } = JSON.parse(buffer.toString()));
}

console.log({
  NYM_SERVER_ADDRESS,
  NYM_CLIENT_URL,
});

module.exports = {
  NYM_SERVER_ADDRESS,
  NYM_CLIENT_URL,
  APP_DATA_PATH,
};
