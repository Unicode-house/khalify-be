import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { ResponseHelper } from '../../helper/base.response';

@Injectable()
export class OrderService {

    constructor(
      @InjectRepository(Order)
      private readonly orderRepo: Repository<Order>,
    ) {}


    async getOrder() { 
        const orders = await this.orderRepo.find();
        return ResponseHelper.collection(orders, 'Orders retrieved successfully');
    }
}
