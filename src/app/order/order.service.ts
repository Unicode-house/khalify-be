import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {

    constructor(private readonly ps:PrismaService) {}


    async getOrder() { 
        const order = await this.ps.client.order.findMany();
        return {
            data:order
        }
    }
}
