import { type Dag, type DagMeta, hash, topSort } from './dag';

const hashToDagMeta = new Map<string, DagMeta>();

// export const registerDag = (dag: Dag) => {
//   const { dag: dagHash } = hash(dag);
//   hashToDag.set(dagHash, dag);
//   return dagHash;
// };

// export const hasDag = (dag: Dag) => {
//   const { dag: dagHash } = hash(dag);
//   return dagHash in hashToDag;
// };

// export const getDag = (dagHash: string) => {
//   console.log(`Getting dag for "${dagHash}"`);
//   return hashToDag.get(dagHash);
// };

export const create = (dag: Dag) => {
  const { dag: dagHash, nodes: nodeHashes } = hash(dag);

  if (hashToDagMeta.has(dagHash)) {
    // TODO
  } else {
    const dagMeta: DagMeta = {
      dag,
      hash: dagHash,
      nodeHashes,
      sortedNodes: topSort(dag),
    };
    hashToDagMeta.set(dagHash, dagMeta);
  }
};
