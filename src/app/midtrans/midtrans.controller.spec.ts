import { Test, TestingModule } from '@nestjs/testing';
import { MidtransController } from './midtrans.controller';

describe('MidtransController', () => {
  let controller: MidtransController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MidtransController],
    }).compile();

    controller = module.get<MidtransController>(MidtransController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
