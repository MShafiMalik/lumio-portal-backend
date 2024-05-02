import { Test, TestingModule } from '@nestjs/testing';
import { JobQueueService } from './job-queue.service';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

jest.mock('bullmq', () => {
  const original = jest.requireActual('bullmq');
  const mockWorker = {
    on: jest.fn(),
    removeListener: jest.fn(),
    once: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    emit: jest.fn(),
  };
  const mockQueue = {
    add: jest.fn(),
    removeListener: jest.fn(),
    once: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    emit: jest.fn(),
  };
  return {
    ...original,
    Worker: jest.fn(() => mockWorker),
    Queue: jest.fn(() => mockQueue),
  };
});

jest.mock('ioredis', () => {
  const mRedis = {
    on: jest.fn(),
    setMaxListeners: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mRedis),
  };
});

describe('JobQueueService', () => {
  let jobQueueService: JobQueueService;
  let mockQueue: Queue;
  let mockWorker: jest.Mocked<Worker>;
  let mockIORedis: jest.Mocked<IORedis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobQueueService],
    }).compile();

    jobQueueService = module.get<JobQueueService>(JobQueueService);
    mockQueue = new Queue('testQueue') as jest.Mocked<Queue>;
    mockWorker = new Worker('testQueue', jest.fn()) as jest.Mocked<Worker>;
    mockIORedis = new IORedis() as jest.Mocked<IORedis>;
  });

  afterEach((done) => {
    jest.clearAllMocks();
    done();
  });

  it('Should be defined', () => {
    expect(jobQueueService).toBeDefined();
  });

  describe('createJobWithWorker', () => {
    it('should create job with worker and handle completed event', async () => {
      const jobData = { testData: 'test' };
      const jobName = 'testQueue';
      const jobFunction = jest.fn().mockResolvedValueOnce(jobData);

      jest
        .spyOn(jobQueueService, 'getRedisConnection')
        .mockReturnValue(mockIORedis);

      await jobQueueService.createJobWithWorker({
        jobData,
        jobName,
        jobFunction,
      });

      expect(Queue).toHaveBeenCalledWith(jobName, { connection: mockIORedis });
      expect(Worker).toHaveBeenCalledWith(jobName, expect.any(Function), {
        connection: mockIORedis,
      });

      expect(mockQueue.add).toHaveBeenCalledWith(`${jobName}Job`, jobData, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: expect.any(Number),
      });

      const completedHandler = mockWorker.on.mock.calls.find(
        (call) => call[0] === 'completed',
      );

      const [, handlerCallback] = completedHandler as [
        string,
        (job: any) => void,
      ];

      handlerCallback({ id: 'jobId123', data: jobData });

      expect(mockQueue.add).toHaveBeenCalledWith(`${jobName}Job`, jobData, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: expect.any(Number),
      });
    });

    it('should create job with worker and handle failed event', async () => {
      const jobData = { testData: 'test' };
      const jobName = 'testQueue';
      const jobFunction = jest.fn().mockRejectedValueOnce(jobData);

      jest
        .spyOn(jobQueueService, 'getRedisConnection')
        .mockReturnValue(mockIORedis);

      await jobQueueService.createJobWithWorker({
        jobData,
        jobName,
        jobFunction,
      });

      expect(Queue).toHaveBeenCalledWith(jobName, { connection: mockIORedis });
      expect(Worker).toHaveBeenCalledWith(jobName, expect.any(Function), {
        connection: mockIORedis,
      });

      expect(mockQueue.add).toHaveBeenCalledWith(`${jobName}Job`, jobData, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: expect.any(Number),
      });

      const completedHandler = mockWorker.on.mock.calls.find(
        (call) => call[0] === 'failed',
      );
      const [, handlerCallback] = completedHandler as [
        string,
        (job: any) => void,
      ];
      handlerCallback({ id: 'jobId123', data: jobData });

      expect(mockQueue.add).toHaveBeenCalledWith(`${jobName}Job`, jobData, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: expect.any(Number),
      });
    });
  });
});
