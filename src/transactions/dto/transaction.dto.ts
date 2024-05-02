import { WalletDataDto } from './wallet-data.dto';

export class TransactionDto {
  walletAddress: string;
  walletData: WalletDataDto[];
}
