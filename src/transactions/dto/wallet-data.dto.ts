import { BridgeDataDto } from './bridge-data.dto';

export class WalletDataDto {
  bridgeName: string;
  contractAddress: string;
  bridgeData: BridgeDataDto[];
}
