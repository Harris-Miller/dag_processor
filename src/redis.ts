import { isNotNil } from 'ramda';
import { createClient } from 'redis';

import type { DagMeta } from './dag/dag';
import type { NodeMeta } from './dag/node';

export const redisClient = await createClient()
  .on('error', err => {
    console.log('Redis Client Error', err);
  })
  .connect();

export const hSetDag = (hash: string, dag: DagMeta) => redisClient.hSet('dag', hash, JSON.stringify(dag));

export const hGetDag = async (hash: string) => {
  const dagNodeString = await redisClient.hGet('dag', hash);
  return isNotNil(dagNodeString) ? (JSON.parse(dagNodeString) as DagMeta) : undefined;
};

export const hSetNode = (hash: string, node: NodeMeta) => redisClient.hSet('dagNode', hash, JSON.stringify(node));

export const hGetNode = async (hash: string) => {
  const dagNodeString = await redisClient.hGet('dagNode', hash);
  return isNotNil(dagNodeString) ? (JSON.parse(dagNodeString) as NodeMeta) : undefined;
};
