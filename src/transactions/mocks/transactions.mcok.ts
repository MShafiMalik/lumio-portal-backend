import { TokensEnum } from '../../utils/enums/tokens.enum';
import { BridgeDataDto } from '../dto/bridge-data.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { WalletDataDto } from '../dto/wallet-data.dto';

export const walletAddressMock1 = '0x6798f75bbc9680b33b9D0660C65F8732a9369cC5';
export const walletAddressMock2 = '0xE8aCA6561a89b8Aae10f1C3305781E319972fDc5';

export const contractAddressMock = '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc';

export const tokensPricesInUsed = {
  ethereum: 36.338,
  pepe: 0.00000734,
  pork: 0.00002715,
  usdc: 0,
  usdt: 0,
};

export const lumioBridgeDataMock = [
  {
    hash: '0xa613c1961b8f7b1c4235b49bbcaf5dceb7c2b36eb505cc16b1c5941016531fb0',
    timeStamp: '1709637179',
    blockNumber: '19368589',
    value: '10000000000000000',
    token: TokensEnum.eth,
  },
];

export const transactionMock1: TransactionDto = {
  walletAddress: walletAddressMock1,
  walletData: [
    {
      bridgeName: 'Lumio',
      contractAddress: contractAddressMock,
      bridgeData: lumioBridgeDataMock,
    },
  ],
};

export const blastBridgeDataMock: BridgeDataDto[] = [
  {
    blockNumber: '19273652',
    timeStamp: '1708489535',
    hash: '0x8ce90d51013d5dcf6d1092abb03ce9047aa70a63951b575cf68cf5a2f60c2ef7',
    value: '2589345366000000000000',
    token: TokensEnum.eth,
  },
  {
    blockNumber: '19273877',
    timeStamp: '1710874801',
    hash: '0x5bb8a90db095c5e3a1461b24de774f46212ed432124d1399ec92a8f0aad38f53',
    value: '88165754966000000000000',
    token: TokensEnum.eth,
  },
];

export const transactionMock2: TransactionDto = {
  walletAddress: walletAddressMock2,
  walletData: [
    {
      bridgeName: 'Blast',
      contractAddress: '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d',
      bridgeData: blastBridgeDataMock,
    },
  ],
};

export const transLumioBlastMock: TransactionDto = {
  walletAddress: walletAddressMock1,
  walletData: [
    {
      bridgeName: 'Lumio',
      contractAddress: contractAddressMock,
      bridgeData: lumioBridgeDataMock,
    },
    {
      bridgeName: 'Blast',
      contractAddress: '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d',
      bridgeData: blastBridgeDataMock,
    },
  ],
};

export const walletDataMock: WalletDataDto[] = [
  {
    bridgeName: 'Lumio',
    contractAddress: contractAddressMock,
    bridgeData: lumioBridgeDataMock,
  },
  {
    bridgeName: 'Blast',
    contractAddress: '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d',
    bridgeData: blastBridgeDataMock,
  },
  {
    bridgeName: 'Optimism',
    contractAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
    bridgeData: blastBridgeDataMock,
  },
];

export const uniswapStatusMock = {
  walletAddress: walletAddressMock1,
  status: true,
};

export const createTransactionDbDataMock = {
  walletAddress: walletAddressMock1,
  walletData: [
    {
      bridgeName: 'Lumio',
      contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
      bridgeData: [
        {
          hash: '0xa613c1961b8f7b1c4235b49bbcaf5dceb7c2b36eb505cc16b1c5941016531fb0',
          timeStamp: '1709637179',
          blockNumber: '19368589',
          value: '10000000000000000',
          token: TokensEnum.eth,
        },
      ],
    },
  ],
  save: jest.fn().mockResolvedValue(null),
};

export const createTransactionMockData: TransactionDto = {
  walletAddress: '0x6798f75bbc9680b33b9D0660C65F8732a9369cC5',
  walletData: [
    {
      bridgeName: 'Lumio',
      contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
      bridgeData: [
        {
          hash: '0xa613c1961b8f7b1c4235b49bbcaf5dceb7c2b36eb505cc16b1c5941016531fb0',
          timeStamp: '1709637179',
          blockNumber: '19368589',
          value: '10000000000000000',
          token: TokensEnum.eth,
        },
        {
          blockNumber: '19273652',
          timeStamp: '1708489535',
          hash: '0x8ce90d51013d5dcf6d1092abb03ce9047aa70a63951b575cf68cf5a2f60c2ef7',
          value: '2589345366000000000000',
          token: TokensEnum.eth,
        },
      ],
    },
    {
      bridgeName: 'Blast',
      contractAddress: '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d',
      bridgeData: [
        {
          blockNumber: '19273652',
          timeStamp: '1708489535',
          hash: '0x8ce90d51013d5dcf6d1092abb03ce9047aa70a63951b575cf68cf5a2f60c2ef7',
          value: '2589345366000000000000',
          token: TokensEnum.eth,
        },
        {
          blockNumber: '19273877',
          timeStamp: '1710874801',
          hash: '0x5bb8a90db095c5e3a1461b24de774f46212ed432124d1399ec92a8f0aad38f53',
          value: '88165754966000000000000',
          token: TokensEnum.eth,
        },
      ],
    },
  ],
};

export const etherscanApiKeyMock = '123456';

export const etherscanApiResponseMock = {
  status: '1',
  message: 'OK-Missing/Invalid API Key, rate limit of 1/5sec applied',
  result: [
    {
      blockNumber: '4730207',
      timeStamp: '1513240363',
      hash: '0xe8c208398bd5ae8e4c237658580db56a2a94dfa0ca382c99b776fa6e7d31d5b4',
      nonce: '406',
      blockHash:
        '0x022c5e6a3d2487a8ccf8946a2ffb74938bf8e5c8a3f6d91b41c56378a96b5c37',
      from: '0x642ae78fafbb8032da552d619ad43f1d81e4dd7c',
      contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      to: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
      value: '5901522149285533025181',
      tokenName: 'Maker',
      tokenSymbol: 'MKR',
      tokenDecimal: '18',
      transactionIndex: '81',
      gas: '940000',
      gasPrice: '32010000000',
      gasUsed: '77759',
      cumulativeGasUsed: '2523379',
      input: 'deprecated',
      confirmations: '14758652',
    },
    {
      blockNumber: '4764973',
      timeStamp: '1513764636',
      hash: '0x9c82e89b7f6a4405d11c361adb6d808d27bcd9db3b04b3fb3bc05d182bbc5d6f',
      nonce: '428',
      blockHash:
        '0x87a4d04a6d8fce7a149e9dc528b88dc0c781a87456910c42984bdc15930a2cac',
      from: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
      contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      to: '0x69076e44a9c70a67d5b79d95795aba299083c275',
      value: '132520488141080',
      tokenName: 'Maker',
      tokenSymbol: 'MKR',
      tokenDecimal: '18',
      transactionIndex: '167',
      gas: '940000',
      gasPrice: '35828000000',
      gasUsed: '127593',
      cumulativeGasUsed: '6315818',
      input: 'deprecated',
      confirmations: '14723886',
    },
    {
      blockNumber: '4776460',
      timeStamp: '1513941310',
      hash: '0xb042fda6860e8fbf85d231fc2592c0a05102fef0b3abb598a48815bb7bda5d8c',
      nonce: '489',
      blockHash:
        '0x830bc2f54eb058b46e18fd8e4f6e002e29172f4054ef7bc73f48f600658f7de7',
      from: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
      contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      to: '0x69076e44a9c70a67d5b79d95795aba299083c275',
      value: '14319250673330303',
      tokenName: 'Maker',
      tokenSymbol: 'MKR',
      tokenDecimal: '18',
      transactionIndex: '54',
      gas: '940000',
      gasPrice: '40000000000',
      gasUsed: '129551',
      cumulativeGasUsed: '1856920',
      input: 'deprecated',
      confirmations: '14712399',
    },
  ],
};
