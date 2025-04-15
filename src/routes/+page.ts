import type { PageLoad } from './$types';
import type { PfasPoint } from '$lib/types/pfas';

export const ssr = false; // à revoir
let path = '/data/pfasData/pfas_sample_hard_with_nuts.json';

export const load: PageLoad = async ({ fetch }) => {
	const start = performance.now();

	const response = await fetch(path);
	const json: PfasPoint[] = await response.json();

	const end = performance.now();
	console.log(`[+page.ts] Data loaded in ${(end - start).toFixed(2)} ms`);

	return {json};
};
