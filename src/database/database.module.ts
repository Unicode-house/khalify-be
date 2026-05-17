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
      // imports: [ConfigModule],
      // inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: "202.10.43.18",
        port: 3306,
        username: "delr7482_khlasify",
        password: "khlasify2026db",
        database: "delr7482_khlasify",
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
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
