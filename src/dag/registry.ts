import { isNil, isNotNil } from 'ramda';

import { hGetDag, hGetNode, hSetDag, hSetNode } from '../redis';

import { type Dag, hash, topSort } from './dag';
import { createDagNode, type NodeMeta } from './node';

export const create = async (dag: Dag) => {
  const { dag: dagHash, nodes: nodeHashes } = hash(dag);

  let dagMeta = await hGetDag(dagHash);

  if (isNil(dagMeta)) {
    dagMeta = {
      dag,
      id: dagHash,
      nodeHashes,
      sortedNodes: topSort(dag),
    };

    await hSetDag(dagHash, dagMeta);
  }

  const nodeMetasEntries = await Promise.all(
    Object.entries(nodeHashes).map(async ([nodeId, nodeHash]): Promise<[string, NodeMeta]> => {
      const nodeMetaFromCache = await hGetNode(nodeHash);

      if (isNotNil(nodeMetaFromCache)) {
        return [nodeId, nodeMetaFromCache];
      }

      const upstreamHashes = dag[nodeId]!.map(id => nodeHashes[id]!);
      const nodeMeta = createDagNode(nodeId, nodeHash, upstreamHashes);
      await hSetNode(nodeHash, nodeMeta);

      return [nodeId, nodeMeta];
    }),
  );

  const nodeMetas = Object.fromEntries(nodeMetasEntries);

  return {
    dag: dagMeta.dag,
    id: dagMeta.id,
    nodes: nodeMetas,
  };
};

export const get = async (dagHash: string) => hGetDag(dagHash);
