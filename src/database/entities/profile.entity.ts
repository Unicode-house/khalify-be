import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { HighLight } from './highlight.entity';
import { Widget } from './widget.entity';
import { Order } from './order.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @CreateDateColumn({ name: 'created_at' })
  create_at: Date;

  @Column({ unique: true, name: 'user_id' })
  userId: string;

  @Column({ default: false, name: 'is_pro' })
  isPro: boolean;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Order, (order) => order.profile)
  orders: Order[];

  @OneToMany(() => HighLight, (highlight) => highlight.profile)
  highLights: HighLight[];

  @OneToMany(() => Widget, (widget) => widget.profile)
  widgets: Widget[];
}
