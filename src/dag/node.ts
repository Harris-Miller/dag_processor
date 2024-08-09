type NodeStatus = 'error' | 'not_yet_started' | 'ok' | 'processing';

export type NodeMeta = {
  hash: string;
  id: string;
  status: NodeStatus;
  totalTime: number | null;
  upstream: Record<string, string>;
};

export const createDagNode = (id: string, hash: string, upstream: Record<string, string>): NodeMeta => ({
  hash,
  id,
  status: 'not_yet_started',
  totalTime: null,
  upstream,
});
