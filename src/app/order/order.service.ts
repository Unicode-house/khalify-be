import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';

@Injectable()
export class OrderService {

    constructor(
      @InjectRepository(Order)
      private readonly orderRepo: Repository<Order>,
    ) {}


    async getOrder() { 
        const order = await this.orderRepo.find();
        return {
            data:order
        }
    }
}
