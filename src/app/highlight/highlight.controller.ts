import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('⭐ Highlights')
@Controller('highlight')
export class HighlightController {}
