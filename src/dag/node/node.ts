type NodeStatus = 'error' | 'not_yet_started' | 'ok' | 'processing';

type DagNode = {
  hash: string;
  id: string;
  status: NodeStatus;
  total_time: number | undefined;
  upstream: Record<string, string>;
};

const createDagNode = (id: string, hash: string): DagNode => ({
  hash,
  id,
  status: 'not_yet_started',
  total_time: undefined,
  upstream: {},
});
