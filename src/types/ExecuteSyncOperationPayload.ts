import type { ExecuteSyncOperationSuccess } from './ExecuteSyncOperationSuccess';
import type { ExecuteSyncOperationError } from './ExecuteSyncOperationError';

export type ExecuteSyncOperationPayload = {
  operationSystemName: string;
  operationBody: { [key: string]: any };
  onSuccess: (data: ExecuteSyncOperationSuccess) => void;
  onError: (error: ExecuteSyncOperationError) => void;
};
