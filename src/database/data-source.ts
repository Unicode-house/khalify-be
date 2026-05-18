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
        host: "202.10.43.18",
        port: 3306,
        username: "delr7482_khlasify",
        password: "khlasify2026db",
        database: "delr7482_khlasify",
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  charset: 'utf8mb4',
});
