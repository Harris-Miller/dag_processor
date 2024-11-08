import * as R from 'ramda';

import { calcDownstreams, type Dag, type Downstreams, type Hash, hash, topSort } from '../dag/dag';
import { createDagNode, type NodeMeta } from '../dag/node';
import { getDag, getNode, setDag, setDagForNode, setNode } from '../redis';

import { nodeQueue } from './bullQueue';
// import { beginNode } from './node.reg';

export const create = async (dag: Dag) => {
  const { dag: dagHash, nodes: nodeHashes } = hash(dag);

  let dagMeta = await getDag(dagHash);

  if (R.isNil(dagMeta)) {
    const downstreams = Object.entries(calcDownstreams(dag)).reduce<Downstreams>((acc, [key, value]) => {
      // eslint-disable-next-line no-param-reassign
      acc[nodeHashes[key]!] = value.map(k => nodeHashes[k]!);
      return acc;
    }, {});

    dagMeta = {
      dag,
      downstreams,
      id: dagHash,
      nodeHashes,
      sortedNodes: topSort(dag),
    };

    await setDag(dagHash, dagMeta);
  }

  const nodeMetasEntries = await Promise.all(
    Object.entries(nodeHashes).map(async ([nodeId, nodeHash]): Promise<[string, NodeMeta]> => {
      const nodeMetaFromCache = await getNode(nodeHash);

      if (R.isNotNil(nodeMetaFromCache)) {
        return [nodeId, nodeMetaFromCache];
      }

      const upstreamHashes = dag[nodeId]!.map(id => nodeHashes[id]!);
      const nodeMeta = createDagNode(nodeId, nodeHash, upstreamHashes);
      await setNode(nodeHash, nodeMeta);
      await setDagForNode(nodeHash, dagHash);

      return [nodeId, nodeMeta];
    }),
  );

  nodeMetasEntries.forEach(([_, nodeMeta]) => {
    if (Object.keys(nodeMeta.upstream).length === 0) {
      console.log(`beginNode for ${nodeMeta.id}`);
      nodeQueue.add('node', { nodeMeta });
    }
  });

  const nodeMetas = Object.fromEntries(nodeMetasEntries);

  return { ...dagMeta, nodes: nodeMetas };
};

export const get = async (dagHash: string) => {
  const dagMeta = await getDag(dagHash);
  if (R.isNil(dagMeta)) return undefined;

  const nodeMetas = await R.flow(dagMeta.nodeHashes, [
    x => Object.values(x),
    xs =>
      xs.map(async nodeHash => {
        const nodeMetaFromCache = await getNode(nodeHash);
        return [nodeHash, nodeMetaFromCache!] as [Hash, NodeMeta];
      }),
    x => Promise.all(x),
    R.andThen((xs: [Hash, NodeMeta][]) => Object.fromEntries(xs)),
  ]);

  return { ...dagMeta, nodes: nodeMetas };
};
