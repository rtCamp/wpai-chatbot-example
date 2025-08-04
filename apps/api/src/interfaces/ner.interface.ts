export interface NerEntity {
	text: string;
	label: string;
}

export type NerResponse = NerEntity[];
