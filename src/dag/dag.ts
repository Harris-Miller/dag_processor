import objectHash from 'object-hash';
import * as R from 'ramda';

export type Hash = string;

export type NodeId = string;

export type Dag = Record<NodeId, NodeId[]>;

export type DagMeta = {
  dag: Dag;
  downstreams: Record<Hash, Hash[]>;
  id: string;
  nodeHashes: Record<NodeId, Hash>;
  sortedNodes: NodeId[];
};

export type Downstreams = Record<NodeId, Hash[]>;

export const topSort = (dag: Dag) => {
  const asEntries = Object.entries(dag);
  const edgesEntries = asEntries.flatMap(([id, upstream]) => upstream.map<[string, string]>(upId => [upId, id]));
  const origins = R.groupBy(([origin, _upstreams]) => origin, edgesEntries);
  const edges = new Set(edgesEntries);

  const toVisit = asEntries.filter(([_id, upstream]) => R.isEmpty(upstream)).map(([id, _upstreams]) => id);

  const results: string[] = [];

  while (toVisit.length !== 0) {
    const visit = toVisit.shift()!;

    results.push(visit);

    const outgoingEdges = origins[visit] ?? [];
    outgoingEdges.forEach(e => edges.delete(e));

    const nextIds = R.difference(
      outgoingEdges.map(([_from, to]) => to),
      Array.from(edges).map(([_from, to]) => to),
    );

    toVisit.push(...nextIds);
  }

  return results;
};

export const hash = (dag: Dag) => {
  const nodeHashes = topSort(dag).reduce<Record<string, string>>((acc, id) => {
    const upstream = dag[id]!.map(upId => acc[upId]!);
    const nodeHash = objectHash({ [id]: upstream });
    // eslint-disable-next-line no-param-reassign
    acc[id] = nodeHash;
    return acc;
  }, {});

  const dagHash = objectHash(dag);

  return { dag: dagHash, nodes: nodeHashes };
};

export const calcDownstreams = (dag: Dag) =>
  Object.entries(dag).reduce<Downstreams>(
    (acc, [downId, ups]) =>
      ups.reduce((a, id) => {
        // eslint-disable-next-line no-param-reassign
        a[id] = [downId, ...(a[id] ?? [])];
        return a;
      }, acc),
    {},
  );
