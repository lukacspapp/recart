import { Job, Queue } from 'bullmq';
import { BatchProcessingService } from '../../services/BatchProcessing';
import { EventBatch } from '../../types/event';
import { generateUniqueId } from '../../utils/generateUniqueId';
import { logger } from '../../utils/loggerUtils';


jest.mock('../../utils/loggerUtils', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../../utils/generateUniqueId', () => ({
  generateUniqueId: jest.fn(),
}));

describe('BatchProcessingService', () => {
  let mockQueue: jest.Mocked<Queue>;
  let batchProcessingService: BatchProcessingService;
  let sampleEvents: EventBatch;

  beforeEach(() => {
    mockQueue = {
      addBulk: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    batchProcessingService = new BatchProcessingService(mockQueue);

    sampleEvents = [
      {
        eventType: 'order.created',
        data: {
          orderId: 'ord_12345',
          value: 99.99
        }
      },
      {
        eventType: 'order.fulfilled',
        data: {
          orderId: 'ord_12345',
          value: 99.99
        }
      },
      {
        eventType: 'customer.created',
        data: {
          orderId: 'cust_67890',
          value: 0
        }
      }
    ];

    const mockIds = ['mock-id-1', 'mock-id-2', 'mock-id-3'];
    (generateUniqueId as jest.Mock).mockImplementation(() => mockIds.shift());

    jest.clearAllMocks();
  });

  describe('processBatch', () => {
    it('should successfully process a batch of events', async () => {
      mockQueue.addBulk.mockResolvedValue([
        { id: 'mock-id-1', name: 'event:order.created' },
        { id: 'mock-id-2', name: 'event:order.fulfilled' },
        { id: 'mock-id-3', name: 'event:customer.created' }
      ] as Job[]);

      const result = await batchProcessingService.processBatch(sampleEvents);

      expect(generateUniqueId).toHaveBeenCalledTimes(3);

      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);
      const bulkJobsArg = mockQueue.addBulk.mock.calls[0][0];
      expect(bulkJobsArg).toHaveLength(3);

      expect(bulkJobsArg[0].name).toBe('event:order.created');
      expect(bulkJobsArg[0].data.eventType).toBe('order.created');
      expect(bulkJobsArg[0].data.data.orderId).toBe('ord_12345');
      expect(bulkJobsArg[0].data.data.value).toBe(99.99);

      expect(bulkJobsArg[1].name).toBe('event:order.fulfilled');
      expect(bulkJobsArg[1].data.eventType).toBe('order.fulfilled');

      expect(bulkJobsArg[2].name).toBe('event:customer.created');
      expect(bulkJobsArg[2].data.eventType).toBe('customer.created');

      expect(result.hasErrors).toBe(false);
      expect(result.message).toBe('All 3 events successfully enqueued');
      expect(result.results).toHaveLength(3);
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('success');
      expect(result.results[2].status).toBe('success');
    });

    it('should handle errors when processing a batch', async () => {
      const testError = new Error('Redis connection failed');
      mockQueue.addBulk.mockRejectedValue(testError);

      const result = await batchProcessingService.processBatch(sampleEvents);

      expect(generateUniqueId).toHaveBeenCalledTimes(3);

      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Redis connection failed'));

      expect(result.hasErrors).toBe(true);
      expect(result.message).toBe('Some events failed to enqueue: Redis connection failed');
      expect(result.results).toHaveLength(3);
      expect(result.results[0].status).toBe('failed');
      expect(result.results[1].status).toBe('failed');
      expect(result.results[2].status).toBe('failed');
      expect(result.results[0].error).toBe('Redis connection failed');
    });

    it('should handle a batch with one event', async () => {
      const mockJobs = [
        { id: 'unique-id-1', name: 'event:order.created' }
      ] as unknown as Job[];

      mockQueue.addBulk.mockResolvedValue(mockJobs);

      const oneItemBatch = [sampleEvents[0]];

      const result = await batchProcessingService.processBatch(oneItemBatch);

      expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);
      const bulkJobsArg = mockQueue.addBulk.mock.calls[0][0];
      expect(bulkJobsArg).toHaveLength(1);

      expect(result.hasErrors).toBe(false);
      expect(result.message).toBe('All 1 events successfully enqueued');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('success');
    });


    it('should include timestamps and unique event IDs in job data', async () => {
      (generateUniqueId as jest.Mock)
        .mockReturnValueOnce('unique-id-1')
        .mockReturnValueOnce('unique-id-2');


      mockQueue.addBulk.mockResolvedValue([
        { id: 'unique-id-1', name: 'event:order.created' },
        { id: 'unique-id-2', name: 'order.fulfilled' }
      ] as Job[]);


      const smallSample = sampleEvents.slice(0, 2);


      await batchProcessingService.processBatch(smallSample);


      const bulkJobsArg = mockQueue.addBulk.mock.calls[0][0];

      expect(bulkJobsArg[0].data.eventId).toBe('unique-id-1');
      expect(bulkJobsArg[0].data.timestamp).toBeDefined();
      expect(typeof bulkJobsArg[0].data.timestamp).toBe('string');

      expect(bulkJobsArg[1].data.eventId).toBe('unique-id-2');
      expect(bulkJobsArg[1].data.timestamp).toBeDefined();
      expect(typeof bulkJobsArg[1].data.timestamp).toBe('string');

      expect(bulkJobsArg[0].opts?.jobId).toBe('unique-id-1');
      expect(bulkJobsArg[1].opts?.jobId).toBe('unique-id-2');
    });
  });
});
