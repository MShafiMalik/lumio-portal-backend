import { EtherscanService } from '../../etherscan/etherscan.service';
import { TransactionsService } from '../../transactions/transactions.service';

export type GetArgsDataType = (args: any) => { user: string; amount: string };

export interface IJobs {
  jobName: string;
  name: string;
  contractAddress: string;
  startBlock: number;
  rpcUrl: string;
  topics: string[];
  abi: any;
  getArgsData: GetArgsDataType;
  transService?: TransactionsService;
  etherscanService?: EtherscanService;
  chalk: string;
  chunks: number;
}
