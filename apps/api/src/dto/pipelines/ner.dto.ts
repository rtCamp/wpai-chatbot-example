import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NerDto {
	@IsString()
	@ApiProperty({
		name: 'text',
		description: 'Text to perform NER on',
		type: 'string',
		required: true,
	})
	text: string;
}
