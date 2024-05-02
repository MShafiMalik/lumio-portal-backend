import { lumioAbi } from '../abis/lumio-abi';
import { UtilsService } from '../utils.service';
import { BRIDGES } from './bridges';
import { CHUNKS } from './common';
import { blastAbi } from '../abis/blast-abi';
import { IJobs } from '../interfaces/jobs.interface';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();

const utilsService = new UtilsService();

export const tokenJobName = 'Lumio ERC20DepositInitiated';

export const JOBS: IJobs[] = [
  {
    jobName: 'Lumio',
    name: BRIDGES.lumio,
    contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
    startBlock: 19314571,
    rpcUrl: process.env.ETH_RPC_URL,
    topics: [
      '0x35d79ab81f2b2017e19afb5c5571778877782d7a8786f5907f93b0f4702f4f23',
    ],
    abi: lumioAbi,
    getArgsData: utilsService.getLumioArgsData,
    chalk: 'yellow',
    chunks: CHUNKS,
  },
  {
    jobName: tokenJobName,
    name: BRIDGES.lumio,
    contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
    startBlock: 19314571,
    rpcUrl: process.env.ETH_RPC_URL,
    topics: [
      '0x718594027abd4eaed59f95162563e0cc6d0e8d5b86b1c7be8b1b0ac3343d0396',
    ],
    abi: lumioAbi,
    getArgsData: utilsService.getLumioPepePorkArgsData,
    chalk: 'yellow',
    chunks: CHUNKS,
  },
  {
    jobName: 'Optimism',
    name: BRIDGES.optimism,
    contractAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
    startBlock: 12686786,
    rpcUrl: process.env.ETH_RPC_URL,
    topics: [
      '0x35d79ab81f2b2017e19afb5c5571778877782d7a8786f5907f93b0f4702f4f23',
    ],
    abi: lumioAbi,
    getArgsData: utilsService.getLumioArgsData,
    chalk: 'yellow',
    chunks: CHUNKS,
  },
  {
    jobName: 'Blast ETHDeposited',
    name: BRIDGES.blast,
    contractAddress: '0x5f6ae08b8aeb7078cf2f96afb089d7c9f51da47d',
    startBlock: 18602739,
    rpcUrl: process.env.ETH_RPC_URL,
    topics: [
      '0x5fb1eada1aad82df33a14506173621652514a3b876b0157aec3ca284a0472f61',
    ],
    abi: blastAbi,
    getArgsData: utilsService.getBlastArgsData,
    chalk: 'blue',
    chunks: CHUNKS,
  },
  {
    jobName: 'Blast USDDeposited',
    name: BRIDGES.blast,
    contractAddress: '0x5f6ae08b8aeb7078cf2f96afb089d7c9f51da47d',
    startBlock: 18602739,
    rpcUrl: process.env.ETH_RPC_URL,
    topics: [
      '0x8f7ca6ae00dc0904e82dea1f2b4a15053fa68c9364faea9fa6a77c500f696fba',
    ],
    abi: blastAbi,
    getArgsData: utilsService.getBlastArgsData,
    chalk: 'green',
    chunks: CHUNKS,
  },
];
