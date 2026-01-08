import { Module } from '@nestjs/common';
import { HighlightService } from './highlight.service';
import { HighlightController } from './highlight.controller';

@Module({
  providers: [HighlightService],
  controllers: [HighlightController]
})
export class HighlightModule {}
