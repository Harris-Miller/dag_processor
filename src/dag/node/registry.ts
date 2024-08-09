import * as R from 'ramda';

import { getDagsForNode, hGetDag, hSetNode } from '../../redis';
import { AsyncQueue } from '../../utils/asyncQueue/asyncQueue';
import type { NodeMeta } from '../node';

const asyncQueue = new AsyncQueue();

const processNextNodes = async (nodeHash: string) => {
  // const dagHashes = await getDagsForNode(nodeHash);
  // const dagMetas = await Promise.all(dagHashes.map(hGetDag));
  // const upstreams = R.indexBy(nodeMeta => nodeHash.hash, await Promise.all(R.flow(dagMetas, [
  //   dms => dms.filter(R.isNotNil),
  //   dms => dms.flatMap(dm => dm.)
  // ])));
  // Promise.all(dagMetas.filter(R.isNotNil).map(dagHashes =>))
};

export const beginNode = (nodeMeta: NodeMeta) => {
  const procNode = async () => {
    await hSetNode(nodeMeta.hash, { ...nodeMeta, status: 'processing' });

    const totalTime = await new Promise<number>((resolve, _reject) => {
      const worker = new Worker('./node.proc');
      worker.addEventListener('message', (event: Bun.MessageEvent<{ totalTime: number }>) => {
        resolve(event.data.totalTime);
      });
    });

    await hSetNode(nodeMeta.hash, { ...nodeMeta, status: 'ok', totalTime });

    processNextNodes(nodeMeta.hash);
  };

  asyncQueue.push(procNode);
};
