import https from 'https';

function urlToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      }).on('end', () => {
        resolve(Buffer.concat(data));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 *
 * @param {*} file
 * @param {import("../context").Context} context
 */
export default async function fetch({ hash }, context) {
  const { buckets, bucketKey } = context;

  const result = await buckets.links(bucketKey, hash);

  console.log(hash, result)

  const buffer = await urlToBuffer(result.url);

  return {
    action: 'FETCH',
    result: 'SUCCESS',
    content: buffer.toString(),
    hash,
  };
}
