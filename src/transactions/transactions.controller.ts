import { Controller, Get, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionResponseDto } from './dto/response.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('/:wallet')
  getTransactionsByWallet(
    @Param('wallet') wallet: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransactionsByWallet(wallet);
  }
}
