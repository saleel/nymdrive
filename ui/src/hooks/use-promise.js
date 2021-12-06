// @ts-check

import React from 'react';

/**
 * @typedef UsePromiseOptions
 * @property [defaultValue] {any}
 * @property [dependencies = []] {Array}
 * @property [conditions = []] {Array}
 * @property [refreshInterval] {number}
 */

/**
 * @template T
 * @param {(() => Promise<T>)} promise
 * @param {UsePromiseOptions} [options]
 * @returns {[T, { isFetching: boolean, error: Error, reFetch: Function }]}
 */
function usePromise(promise, options = {}) {
  const {
    defaultValue, dependencies = [], conditions = [], refreshInterval,
  } = options;

  const [result, setResult] = React.useState(defaultValue);
  const [isFetching, setIsFetching] = React.useState(false);
  const [error, setError] = React.useState();

  let didCancel = false;

  async function fetch() {
    setIsFetching(true);

    try {
      const data = await promise();
      if (!didCancel) {
        setResult(data);
      }
    } catch (e) {
      if (!didCancel) {
        // eslint-disable-next-line no-console
        console.error('Error on fetching data', e);
        setError(e);
        // if (cacheKey) {
        //   cache.delete(cacheKey);
        // }
      }
    }

    setIsFetching(false);
  }

  React.useEffect(() => {
    const allConditionsValid = conditions.every((condition) => {
      if (typeof condition === 'function') return !!condition();
      return !!condition;
    });

    if (!allConditionsValid) return;

    fetch();

    let interval;
    if (refreshInterval) {
      interval = setInterval(() => fetch(), refreshInterval);
    }

    // eslint-disable-next-line consistent-return
    return () => {
      // eslint-disable-next-line
      didCancel = true;
      clearInterval(interval);
    };
  }, [...dependencies, ...conditions]);

  function reFetch() {
    return fetch();
  }

  return [result, {
    isFetching, error, reFetch,
  }];
}

export default usePromise;
