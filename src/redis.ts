import { isNotNil } from 'ramda';
import { createClient } from 'redis';

import type { DagMeta } from './dag/dag';
import type { NodeMeta } from './dag/node';

export const redisClient = await createClient()
  .on('error', err => {
    console.log('Redis Client Error', err);
  })
  .connect();

await redisClient.flushAll();

export const setDag = (hash: string, dag: DagMeta) => redisClient.hSet('dag:table', hash, JSON.stringify(dag));

export const getDag = async (hash: string) => {
  const dagNodeString = await redisClient.hGet('dag:table', hash);
  return isNotNil(dagNodeString) ? (JSON.parse(dagNodeString) as DagMeta) : undefined;
};

export const setNode = (hash: string, node: NodeMeta) => redisClient.hSet('dagNode:table', hash, JSON.stringify(node));

export const getNode = async (hash: string) => {
  const dagNodeString = await redisClient.hGet('dagNode:table', hash);
  return isNotNil(dagNodeString) ? (JSON.parse(dagNodeString) as NodeMeta) : undefined;
};

export const getNodes = async (hashes: string[]) => Promise.all(hashes.map(getNode));

export const setDagForNode = (nodeHash: string, dagHash: string) =>
  redisClient.sAdd(`nodeBelongsToDags:${nodeHash}`, dagHash);

export const getDagsForNode = async (nodeHash: string) => redisClient.sMembers(`nodeBelongsToDags:${nodeHash}`);
