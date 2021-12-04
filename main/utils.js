const crypto = require('crypto');
const fs = require('fs');

/**
 *
 * @param {Buffer} buffer
 * @param {string} algorithm
 * @returns
 */
function hashFile(buffer, algorithm = 'md5') {
  return new Promise((resolve, reject) => {
    try {
      const shasum = crypto.createHash(algorithm);
      shasum.update(buffer);
      resolve(shasum.digest('hex'));
    } catch (error) {
      reject(error);
    }
  });
}

function encryptFile(path, key) {
  return new Promise((resolve) => {
    const iv = crypto.randomBytes(16); // Each file encrypted with a new key
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);

    const input = fs.readFileSync(path);
    const output = Buffer.concat([cipher.update(input), cipher.final()]);

    const outputWithIv = `${iv.toString('hex')}:${output.toString('base64')}`;

    resolve(outputWithIv);
  });
}

function decryptFile(fileContentString, key) {
  return new Promise((resolve) => {
    const [ivHex, contentBase64] = fileContentString.split(':');

    const cipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
    const output = Buffer.concat([cipher.update(Buffer.from(contentBase64, 'base64')), cipher.final()]);

    resolve(output);
  });
}

module.exports = {
  hashFile,
  encryptFile,
  decryptFile,
};
