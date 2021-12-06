import dotenv from 'dotenv';
import { Buckets } from '@textile/hub';

dotenv.config();

/**
 *
 * @typedef Context
 * @property {Buckets} buckets:
 * @property {string} bucketKey
 */

/**
 *
 * @returns {Context}
 */
async function buildContext() {
  const keyInfo = {
    key: process.env.THREAD_KEY,
    secret: process.env.THREAD_SECRET,
  };

  const buckets = await Buckets.withKeyInfo(keyInfo);

  const result = await buckets.open('hackatom.nym');
  if (!result.root) {
    throw new Error('Failed to open bucket');
  }

  return {
    buckets,
    bucketKey: result.root.key,
  };
}

export default buildContext;
