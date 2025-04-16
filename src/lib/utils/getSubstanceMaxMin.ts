import type { PfasPoint } from "$lib/types/pfas";

export function getSubstanceMaxMin(points: PfasPoint[], substance: string): { max: number; min: number } {
    let max = 0;
    let min = +Infinity;
    console.log("[getSubstanceMaxMin] working");
    for (const p of points) {
        try {
            const values = JSON.parse(p.pfas_values ?? "[]");
            for (const entry of values) {
                if (entry.substance === substance) {
                    const val = parseFloat(entry.value ?? entry.less_than);
                    if (!isNaN(val)) {
                        max = Math.max(max, val);
                        min = Math.min(min, val);
                    }
                }
            }
        } catch {
            // skip
        }
    }
    console.log("[getSubstanceMaxMin] done");
    return { max, min };
}
