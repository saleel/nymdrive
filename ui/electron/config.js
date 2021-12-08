const fs = require('fs');

let NYM_SERVER_ADDRESS = 'ECgMYfLgvm6Z57RgCqytEyuYPBwkWyL3CPHC9DDSCiBU.DnuvLQpCLmLzjTeLMBmzYFLbRDAaafrN2LxVvNYeBn5V@EQhjPpUuy4i1u87nfQMW21WiBT5mJk4dcq4ju7Vct7cB';
let NYM_CLIENT_URL = 'ws://localhost:1977';

const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support/` : `${process.env.HOME}/.local/share`);
const configFilePath = `${appDataDir}nym-drive/config.json`;

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
};
