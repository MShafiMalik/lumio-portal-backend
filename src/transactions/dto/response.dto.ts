import { WalletInfoDto } from './wallet-info.dto';
import { WalletStatusDto } from './wallet-status.dto';

export class TransactionResponseDto {
  walletInfo: WalletInfoDto;
  walletStatus: WalletStatusDto;
}
