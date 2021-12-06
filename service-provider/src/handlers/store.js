/**
 *
 * @param {*} file
 * @param {import("../context").Context} context
 */
export default async function store(file, context) {
  const { buckets, bucketKey } = context;

  const result = await buckets.pushPath(bucketKey, file.hash, Buffer.from(file.content));

  console.log(`File ${file.hash} stored to IPFS: `, result);

  return {
    action: 'STORE',
    result: 'SUCCESS',
    storedPath: result.path.path,
    hash: file.hash,
  };
}
