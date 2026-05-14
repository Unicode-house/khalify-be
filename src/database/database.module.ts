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
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'khalify'),
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
