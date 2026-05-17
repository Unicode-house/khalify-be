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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', '202.10.43.18'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'delr7482_khlasify'),
        password: "khlasify2026db",
        database: configService.get<string>('DB_DATABASE', 'delr7482_khlasify'),
        entities: [User, Payment, MagicLink, HighLight, Profile, Widget, Order],
        synchronize: configService.get<string>('NODE_ENV', 'development') !== 'production',
        logging: configService.get<string>('NODE_ENV', 'development') !== 'production',
        charset: 'utf8mb4',
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
