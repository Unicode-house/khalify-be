import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Payment,
  MagicLink,
  HighLight,
  Profile,
  Widget,
  Order,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql' as const,
        host: '202.10.43.18',
        port: 3306,
        username: 'delr7482_khlasify',
        password: 'khlasify2026db',
        database: 'delr7482_khlasify',
        entities: [User, Payment, MagicLink, HighLight, Profile, Widget, Order],
        synchronize: true,
        // ─── PERFORMANCE: Aggressive timeouts for serverless ───
        connectTimeout: 5000,
        acquireTimeout: 5000,
        extra: {
          connectionLimit: 3,
          connectTimeout: 5000,
        },
        retryAttempts: 2,
        retryDelay: 1000,
        // ─── Keep connection alive across warm invocations ───
        keepConnectionAlive: true,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Payment,
      MagicLink,
      HighLight,
      Profile,
      Widget,
      Order,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
