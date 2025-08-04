import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NerDto } from '@wpai-chatbot/dto/pipelines/ner.dto';
import { NerEntity } from '@wpai-chatbot/interfaces/ner.interface';

@Injectable()
export class NerService {
	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {}
	async performNer(payload: NerDto): Promise<NerEntity[]> {
		const nlpEndpoint = this.configService.get<string>('NLP_API_ENDPOINT');
		const { data } = await firstValueFrom(
			this.httpService.post<NerEntity[]>(
				`${nlpEndpoint}/ner`,
				{ text: payload.text },
				{
					headers: { 'Content-Type': 'application/json' },
				},
			),
		);

		return data;
	}
}
