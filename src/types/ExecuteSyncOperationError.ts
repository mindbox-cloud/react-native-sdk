type MindboxAPITransactionError = {
  status: 'TransactionAlreadyProcessed';
};

type MindboxAPIValidationError = {
  status: 'ValidationError';
  validationMessages: { message: string; location?: string }[];
};

type MindboxAPIProtocolError = {
  status: 'ProtocolError';
  errorMessage: string;
  errorId: string;
  httpStatusCode: string;
};

type MindboxAPIInternalError = {
  status: 'InternalServerError';
  errorMessage: string;
  errorId: string;
  httpStatusCode: string;
};

type ExecuteSyncOperationMindboxError = {
  type: 'MindboxError';
  data:
    | MindboxAPITransactionError
    | MindboxAPIValidationError
    | MindboxAPIProtocolError
    | MindboxAPIInternalError;
};

type ExecuteSyncOperationNetworkError = {
  type: 'NetworkError';
  data: {
    httpStatusCode?: string;
    errorMessage?: string;
    statusCode?: number;
    status?: string;
    errorId?: string;
  };
};

type ExecuteSyncOperationInternalError = {
  type: 'InternalError';
  data: {
    errorKey?: string;
    errorName?: string;
    errorMessage?: string;
  };
};

export type ExecuteSyncOperationError =
  | ExecuteSyncOperationMindboxError
  | ExecuteSyncOperationNetworkError
  | ExecuteSyncOperationInternalError;
