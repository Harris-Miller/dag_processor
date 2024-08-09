import { isNil, isNotNil } from 'ramda';

import { hGetDag, hGetNode, hSetDag, hSetNode, setDagForNode } from '../redis';

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

      const upstreamHashes = dag[nodeId]!.reduce<Record<string, string>>((acc, id) => {
        // eslint-disable-next-line no-param-reassign
        acc[id] = nodeHashes[id]!;
        return acc;
      }, {});
      const nodeMeta = createDagNode(nodeId, nodeHash, upstreamHashes);
      await hSetNode(nodeHash, nodeMeta);
      await setDagForNode(nodeHash, dagHash);

      return [nodeId, nodeMeta];
    }),
  );

  nodeMetasEntries.forEach(([_, nodeMeta]) => {
    if (Object.keys(nodeMeta.upstream).length === 0) {
      beginNode(nodeMeta);
    }
  });

  const nodeMetas = Object.fromEntries(nodeMetasEntries);

  return {
    dag: dagMeta.dag,
    id: dagMeta.id,
    nodes: nodeMetas,
  };
};

export const get = async (dagHash: string) => hGetDag(dagHash);
