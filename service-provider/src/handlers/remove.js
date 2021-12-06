/**
 *
 * @param {string} fileHash
 * @param {import("../context").Context} context
 */
export default async function remove({ hash }, context) {
  const { buckets, bucketKey } = context;
  const result = await buckets.removePath(bucketKey, hash);

  // const result = await buckets.removePath(bucketKey);

  console.log(`File ${hash} deleted from IPFS: `, result);

  return {
    action: 'REMOVE',
    result: 'SUCCESS',
    hash,
  };
}
