import {
  USER_DATA_ANONYMIZED,
  USER_DELETED,
  UserDataAnonymizedEvent,
} from '../events/event-contracts';
import { UserDeletionService } from './user-deletion.service';

function buildAnonymizedEvent(): UserDataAnonymizedEvent {
  return {
    eventId: 'event-1',
    eventType: USER_DATA_ANONYMIZED,
    version: 1,
    occurredAt: '2026-05-04T15:01:00.000Z',
    producer: 'analysis-store-service',
    correlationId: 'workflow-1',
    data: {
      userId: '507f1f77bcf86cd799439011',
      service: 'analysis-store-service',
      deletedResources: { timelines: 1, privatePanels: 2 },
      anonymizedResources: { publicPanels: 3 },
    },
  };
}

describe('UserDeletionService', () => {
  it('finalizes the workflow and publishes user.deleted when all required services completed', async () => {
    const workflow = {
      userId: '507f1f77bcf86cd799439011',
      status: 'anonymizing',
      correlationId: 'workflow-1',
      requiredServices: ['analysis-store-service'],
      completedServices: [],
      failedServices: [],
      requestedAt: new Date('2026-05-04T15:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const workflowModel = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(workflow) }),
    };
    const userModel = {
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
    };
    const refreshSessionModel = {
      updateMany: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
    };
    const rabbitmqService = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const service = new UserDeletionService(
      userModel as never,
      refreshSessionModel as never,
      workflowModel as never,
      rabbitmqService as never,
    );

    const published = await service.handleDataAnonymized(
      buildAnonymizedEvent(),
    );

    expect(workflow.completedServices).toEqual(['analysis-store-service']);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      workflow.userId,
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'deleted',
          pseudo: 'Utilisateur supprime',
        }),
      }),
    );
    expect(rabbitmqService.publish).toHaveBeenCalledWith(
      USER_DELETED,
      expect.objectContaining({
        eventType: USER_DELETED,
        correlationId: 'workflow-1',
        data: expect.objectContaining({ userId: workflow.userId }),
      }),
    );
    expect(workflow.status).toBe('deleted');
    expect(published?.eventType).toBe(USER_DELETED);
  });

  it('is idempotent when analysis-store-service already completed', async () => {
    const workflow = {
      userId: '507f1f77bcf86cd799439011',
      status: 'deleted',
      correlationId: 'workflow-1',
      requiredServices: ['analysis-store-service'],
      completedServices: ['analysis-store-service'],
      failedServices: [],
      requestedAt: new Date('2026-05-04T15:00:00.000Z'),
      save: jest.fn(),
    };
    const workflowModel = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(workflow) }),
    };
    const rabbitmqService = { publish: jest.fn() };

    const service = new UserDeletionService(
      {} as never,
      {} as never,
      workflowModel as never,
      rabbitmqService as never,
    );

    await expect(
      service.handleDataAnonymized(buildAnonymizedEvent()),
    ).resolves.toBeNull();
    expect(rabbitmqService.publish).not.toHaveBeenCalled();
  });
});
