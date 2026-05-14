import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  REFUND = 'REFUND',
}

export enum PaymentProvider {
  MIDTRANS = 'MIDTRANS',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50, name: 'order_id' })
  orderId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.MIDTRANS,
  })
  provider: PaymentProvider;

  @Column({ nullable: true, length: 255, name: 'snap_token' })
  snapToken: string;

  @Column({ nullable: true, length: 100, name: 'transaction_id' })
  transactionId: string;

  @Column({ nullable: true, type: 'json', name: 'raw_notification' })
  rawNotification: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.orders)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
