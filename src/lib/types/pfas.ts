export interface PfasPoint {
	category: string;
	lat: string;
	lon: string;
	name?: string;
	city?: string;
	country?: string;
	type?: string;
	sector?: string;
	source_type?: string;
	data_collection_method?: string;
	source_text?: string;
	source_url?: string;
	dataset_id?: string;
	dataset_name?: string;
	pfas_values?: string;
	unit?: string;
	pfas_sum?: number;
	details?: string;
	matrix?: string;
	date?: string;
	year?: string;

	nuts?: {
		nuts2016?: NutsLevels;
		nuts2021?: NutsLevels;
		nuts2024?: NutsLevels;
	};
}

export interface NutsLevel {
	NUTS_ID: string;
	NUTS_NAME: string;
}

export interface NutsLevels {
	level0?: NutsLevel | null;
	level1?: NutsLevel | null;
	level2?: NutsLevel | null;
	level3?: NutsLevel | null;
}
