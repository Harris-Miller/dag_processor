import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as R from 'ramda';

import os from 'node:os';

import type { DagMeta } from '../dag/dag';
import type { NodeMeta } from '../dag/node';
import { getDag, getDagsForNode, getNode, getNodes, setNode } from '../redis';

const concurrency = Math.floor(os.cpus().length - 1);

const wait = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, Math.floor(Math.random() * ms));
  });

const connection = new IORedis({ maxRetriesPerRequest: null });

export const nodeQueue = new Queue('node-queue', { connection });

export const readyQueue = new Queue('ready-queue', { connection });

export const nodeWorker = new Worker<{ nodeMeta: NodeMeta }>(
  'node-queue',
  async job => {
    const { nodeMeta } = job.data;

    await setNode(nodeMeta.hash, { ...nodeMeta, status: 'processing' });

    console.log('bullQueue started!');

    const startTime = Date.now();
    await wait(5_000);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`bullQueue finish, took ${totalTime} ms`);

    readyQueue.add('node', { nodeMeta, totalTime });
  },
  { concurrency, connection },
);

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

export const readyWorker = new Worker<{ nodeMeta: NodeMeta; totalTime: number }>(
  'ready-queue',
  async job => {
    const { nodeMeta, totalTime } = job.data;

    await setNode(nodeMeta.hash, { ...nodeMeta, status: 'ok', totalTime });

    const nextNodes = await getNextNodesToProcess(nodeMeta.hash);

    console.log('nextNodes', nextNodes);

    nextNodes.forEach(nm => {
      nodeQueue.add('node', { nodeMeta: nm });
    });
  },
  { connection },
);
