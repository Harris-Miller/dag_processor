import type { Hash } from './dag';

type NodeStatus = 'error' | 'not_yet_started' | 'ok' | 'processing';

export type NodeMeta = {
  hash: Hash;
  id: string;
  status: NodeStatus;
  totalTime: number | null;
  upstream: Hash[];
};

export const createDagNode = (id: string, hash: Hash, upstream: Hash[]): NodeMeta => ({
  hash,
  id,
  status: 'not_yet_started',
  totalTime: null,
  upstream,
});
