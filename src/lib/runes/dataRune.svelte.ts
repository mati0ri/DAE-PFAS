import type { PfasPoint } from '$lib/types/pfas';

class DataRune {
	points = $state<PfasPoint[]>([]);

	categories = $derived(() =>
		Array.from(new Set(this.points.map(p => p.category))).sort()
	);

	filters = $state({
		category: 'Sampling',
		datasetId: [] as number[],
		matrix: [] as string[],
		yearMin: 2000 as number | null,
		yearMax: 2025 as number | null,
		yearRange: [2000, 2025] as number[],
		substances: [] as string[],
		nutsRegions: [] as { year: number; level: number; id: string }[],
		lassoSelection: [] as { lat: number; lon: number }[]
	});
	
	
	availableOptions = $derived(() => {
		const currentCategory = this.filters.category;
		const filtered = this.points.filter(p => p.category === currentCategory);
	
		const datasetCount = new Map<number, { name: string, count: number }>();
		for (const p of filtered) {
			const id = Number(p.dataset_id);
			const name = p.dataset_name ?? `Dataset ${id}`;
			if (!datasetCount.has(id)) {
				datasetCount.set(id, { name, count: 1 });
			} else {
				datasetCount.get(id)!.count++;
			}
		}
	
		const datasetIds = Array.from(datasetCount.entries())
			.map(([id, { name, count }]) => ({ id, name, count }))
			.sort((a, b) => b.count - a.count);
	
		const matrixCount = new Map<string, number>();
		for (const p of filtered) {
			if (p.matrix) {
				matrixCount.set(p.matrix, (matrixCount.get(p.matrix) ?? 0) + 1);
			}
		}
	
		const matrices = Array.from(matrixCount.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	
		return {
			datasetIds,
			matrices
		};
	});
	


	allSubstances = $derived(() => {
		const counter = new Map<string, number>();

		for (const p of this.points) {
			try {
				const parsed = JSON.parse(p.pfas_values ?? '[]');
				for (const entry of parsed) {
					if (entry.substance) {
						counter.set(entry.substance, (counter.get(entry.substance) ?? 0) + 1);
					}
				}
			} catch {
				// SKip
			}
		}

		return Array.from(counter.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([substance]) => substance);
	});

	filteredPoints = $derived(() =>
		this.points.filter((p) => {
			const f = this.filters;

			const matchCategory = f.category === 'Tous' || p.category === f.category;
			const matchDataset = f.datasetId.length === 0 || f.datasetId.includes(Number(p.dataset_id));
			const matchMatrix = f.matrix.length === 0 || f.matrix.includes(p.matrix ?? '');
			const matchYear =
				f.category !== 'Sampling' ||
				((!f.yearRange[0] || Number(p.year) >= f.yearRange[0]) &&
					(!f.yearRange[1] || Number(p.year) <= f.yearRange[1]));

			let matchSubstance = true;
			if (f.substances.length > 0) {
				try {
					const parsed = JSON.parse(p.pfas_values ?? '[]');
					const substancesInPoint = parsed.map((v: any) => v.substance);
					matchSubstance = substancesInPoint.some((s: string) => f.substances.includes(s));
				} catch {
					matchSubstance = false;
				}
			}

			let matchRegion = true;
			if (f.nutsRegions.length > 0) {
				matchRegion = f.nutsRegions.some(({ year, level, id }) => {
					const nutsKey = `nuts${year}` as keyof PfasPoint['nuts'];
					const nuts = (p.nuts?.[nutsKey] as any)?.[`level${level}`];
					return nuts?.NUTS_ID === id;
				});
			}

			return matchCategory &&
				matchDataset &&
				matchMatrix &&
				matchYear &&
				matchSubstance &&
				matchRegion;
		})
	);
}

export let dataRune = new DataRune();
