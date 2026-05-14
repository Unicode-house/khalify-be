import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Payment } from './entities/payment.entity';
import { MagicLink } from './entities/magic-link.entity';
import { HighLight } from './entities/highlight.entity';
import { Profile } from './entities/profile.entity';
import { Widget } from './entities/widget.entity';
import { Order } from './entities/order.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'khalify',
  entities: [User, Payment, MagicLink, HighLight, Profile, Widget, Order],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  charset: 'utf8mb4',
});
