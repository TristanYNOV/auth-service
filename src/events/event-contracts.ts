export const USER_DELETION_REQUESTED = 'user.deletion.requested';
export const USER_DATA_ANONYMIZED = 'user.data.anonymized';
export const USER_DELETED = 'user.deleted';

export type DomainEvent<TData extends Record<string, unknown>> = {
  eventId: string;
  eventType: string;
  version: 1;
  occurredAt: string;
  producer: string;
  correlationId: string;
  data: TData;
};

export type UserDeletionRequestedData = {
  userId: string;
  requestedBy: 'self' | 'admin' | 'system';
  reason: 'user_request' | 'admin_action' | 'test' | 'unknown';
};

export type UserDeletionRequestedEvent =
  DomainEvent<UserDeletionRequestedData> & {
    eventType: typeof USER_DELETION_REQUESTED;
  };

export type UserDataAnonymizedData = {
  userId: string;
  service: 'analysis-store-service';
  deletedResources: {
    timelines: number;
    privatePanels: number;
  };
  anonymizedResources: {
    publicPanels: number;
  };
};

export type UserDataAnonymizedEvent = DomainEvent<UserDataAnonymizedData> & {
  eventType: typeof USER_DATA_ANONYMIZED;
};

export type UserDeletedData = {
  userId: string;
  deletedAt: string;
};

export type UserDeletedEvent = DomainEvent<UserDeletedData> & {
  eventType: typeof USER_DELETED;
};
