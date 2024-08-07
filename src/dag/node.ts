type NodeStatus = 'error' | 'not_yet_started' | 'ok' | 'processing';

export type NodeMeta = {
  hash: string;
  id: string;
  status: NodeStatus;
  total_time: number | undefined;
  upstreamHashes: string[];
};

export const createDagNode = (id: string, hash: string, upstreamHashes: string[]): NodeMeta => ({
  hash,
  id,
  status: 'not_yet_started',
  total_time: undefined,
  upstreamHashes,
});
