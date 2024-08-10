import * as R from 'ramda';

import { getDag, getDagsForNode, getNode, getNodes, setNode } from '../../redis';
import { AsyncQueue } from '../../utils/asyncQueue/asyncQueue';
import type { DagMeta } from '../dag';
import type { NodeMeta } from '../node';

const asyncQueue = new AsyncQueue();

const getNextNodesToProcess = async (nodeHash: string) => {
  const dagHashes = await getDagsForNode(nodeHash);
  const dagMetas = await Promise.all(dagHashes.map(getDag));

  // first, get all downStreams for the nodeHash
  const downStreamNodes = await R.flow(dagMetas, [
    R.filter(R.isNotNil<DagMeta | undefined>),
    (a: DagMeta[]) => a.flatMap(dm => dm.downstreams[nodeHash]).filter(R.isNotNil),
    R.uniq,
    getNodes,
    R.andThen(R.filter(R.isNotNil<NodeMeta | undefined>)),
    R.andThen(R.indexBy<NodeMeta>(nm => nm.hash)),
  ]);

  console.log('downStreamNodes', downStreamNodes);

  // then, get all upstreams for each downStream, pruning duplicates
  const upstreamNodes: Record<string, NodeMeta> = await R.flow(downStreamNodes, [
    Object.values,
    R.chain((n: NodeMeta) => n.upstream),
    R.uniq,
    R.tap(x => {
      console.log('upstreamHashes', x);
    }),
    (nhs: string[]) =>
      nhs.map(h => {
        console.log('hash', h);
        const fromCache = downStreamNodes[h];
        return R.isNotNil(fromCache) ? Promise.resolve(fromCache) : getNode(h);
      }),
    ps => Promise.all(ps),
    R.andThen(R.filter(R.isNotNil<NodeMeta | undefined>)),
    R.andThen(R.indexBy<NodeMeta>(nm => nm.hash)),
  ]);

  console.log('upstreams', Object.keys(upstreamNodes));

  const okToProcessEntries = Object.values(downStreamNodes).filter(nodeMeta => {
    const upstreams = Object.values(nodeMeta.upstream).map(h => upstreamNodes[h]);
    return !upstreams.some(up => R.isNil(up) || up.status !== 'ok');
  });

  return okToProcessEntries;
};

export const beginNode = (nodeMeta: NodeMeta): void => {
  const procNode = async () => {
    await setNode(nodeMeta.hash, { ...nodeMeta, status: 'processing' });

    const totalTime = await new Promise<number>((resolve, _reject) => {
      console.log('creating worker');
      const worker = new Worker(new URL('node.proc.ts', import.meta.url).href);
      worker.addEventListener('message', (event: Bun.MessageEvent<{ totalTime: number }>) => {
        resolve(event.data.totalTime);
      });
    });

    await setNode(nodeMeta.hash, { ...nodeMeta, status: 'ok', totalTime });

    const nextNodes = await getNextNodesToProcess(nodeMeta.hash);

    nextNodes.forEach(beginNode);
  };

  asyncQueue.push(procNode);
};
