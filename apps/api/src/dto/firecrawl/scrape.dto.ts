import { IsNotEmpty, IsString } from 'class-validator';

export class ScrapeDto {
	@IsString()
	@IsNotEmpty()
	url: string;
}

export class ScrapeMultipleDto {
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	urls: string[];

	@IsString()
	@IsNotEmpty()
	userId: string;
}

export class ScrapeUrl {
	@IsString()
	@IsNotEmpty()
	url: string;
}
