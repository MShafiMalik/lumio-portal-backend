import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ProcessDelayMilliseconds } from '../utils/constants/common';

let redisIOConnection: IORedis | null = null;

@Injectable()
export class JobQueueService {
  getRedisConnection = (): IORedis => {
    if (!redisIOConnection) {
      redisIOConnection = new IORedis({
        port: Number(process.env.REDIS_PORT) || 6379, // Redis port
        host: process.env.REDIS_HOST || '127.0.0.1', // Redis host
        username: process.env.REDIS_USERNAME || '', // needs Redis >= 6
        password: process.env.REDIS_PASSWORD || '',
        db: Number(process.env.REDIS_DB) || 0, // Defaults to 0
        maxRetriesPerRequest: null,
      });
      redisIOConnection.setMaxListeners(18); // number of time createJobWithWoker is initiated x2 ( 7x2 = 14 )
    }
    return redisIOConnection;
  };

  createJobWithWorker = async <T>({
    jobData,
    jobName,
    jobFunction,
  }: {
    jobData: T;
    jobName: string;
    jobFunction: (data: T) => Promise<T>;
  }) => {
    const bullQueue = new Queue(jobName, {
      connection: this.getRedisConnection(),
    });

    const worker = new Worker(
      jobName,
      async (job) => {
        // these two lines need to be update
        job.data.getArgsData = (jobData as any).getArgsData;
        job.data.transService = (jobData as any).transService;
        job.data.etherscanService = (jobData as any).etherscanService;
        ///////////

        const data: T = job.data;
        await jobFunction(data);
      },
      { connection: this.getRedisConnection() },
    );

    await bullQueue.add(`${jobName}Job`, jobData, {
      removeOnComplete: true,
      removeOnFail: true,
      delay: ProcessDelayMilliseconds,
    });

    worker.on('completed', async (job) => {
      await bullQueue.add(`${jobName}Job`, job.data, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: ProcessDelayMilliseconds,
      });
    });

    worker.on('failed', async (job) => {
      await bullQueue.add(`${jobName}Job`, job!.data, {
        removeOnComplete: true,
        removeOnFail: true,
        delay: ProcessDelayMilliseconds,
      });
    });
  };
}
