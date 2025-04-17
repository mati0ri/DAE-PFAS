<script lang="ts">
	import {
		Slider as SliderPrimitive,
		type WithoutChildrenOrChild,
	} from "bits-ui";
	import { cn } from "$lib/utils.js";
	import * as d3 from "d3";
	import { onMount } from "svelte";
	import { dataRune } from "$lib/runes/dataRune.svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props();

	let histogramContainer: HTMLDivElement;

	onMount(() => {
		$effect(() => {
			if (!histogramContainer) return;

			const margin = { top: 4, right: 4, bottom: 4, left: 4 };
			const width =
				histogramContainer.clientWidth - margin.left - margin.right;
			const height =
				histogramContainer.clientHeight - margin.top - margin.bottom;

			d3.select(histogramContainer).selectAll("svg").remove();

			const svg = d3
				.select(histogramContainer)
				.append("svg")
				.attr(
					"viewBox",
					`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`,
				)
				.attr("preserveAspectRatio", "xMidYMid meet")
				.style("width", "100%")
				.style("height", "100%")
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			const yearCounts = d3.rollup(
				dataRune.points.filter(
					(d) => (d.year ?? null) !== null && !isNaN(+(d.year ?? 0)),
				),
				(v) => v.length,
				(d) => +(d.year ?? 0),
			);

			const years = Array.from(
				{ length: 2025 - 2000 + 1 },
				(_, i) => 2000 + i,
			);
			const x = d3.scaleLinear().domain([2000, 2025]).range([0, width]);
			const y = d3
				.scaleLinear()
				.domain([
					0,
					d3.max(years.map((y) => yearCounts.get(y) ?? 0)) ?? 1,
				])
				.range([height, 0]);

			const line = d3
				.line<number>()
				.x((d) => x(d))
				.y((d) => y(yearCounts.get(d) ?? 0))
				.curve(d3.curveMonotoneX);

			svg.append("path")
				.datum(years)
				.attr("fill", "none")
				.attr("stroke", "hsl(var(--primary))")
				.attr("stroke-width", 1.5)
				.attr("stroke-opacity", 0.5)
				.attr("d", line);
		});
	});
</script>

<div bind:this={histogramContainer} class="h-16 w-full relative"></div>

<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	{orientation}
	class={cn(
		"relative flex touch-none select-none items-center data-[orientation='vertical']:h-full data-[orientation='vertical']:min-h-44 data-[orientation='horizontal']:w-full data-[orientation='vertical']:w-auto data-[orientation='vertical']:flex-col",
		className,
	)}
	{...restProps}
>
	{#snippet children({ thumbs })}
		<span
			data-orientation={orientation}
			class="bg-secondary relative grow overflow-hidden rounded-full data-[orientation='horizontal']:h-2 data-[orientation='vertical']:h-full data-[orientation='horizontal']:w-full data-[orientation='vertical']:w-2"
		>
			<SliderPrimitive.Range
				class="bg-primary absolute data-[orientation='horizontal']:h-full data-[orientation='vertical']:w-full"
			/>
		</span>
		{#each thumbs as thumb (thumb)}
			<SliderPrimitive.Thumb
				index={thumb}
				class="relative border-primary bg-background ring-offset-background focus-visible:ring-ring block size-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			>
				<!-- Valeur en dessous du thumb -->
				{#if Array.isArray(value)}
					<div
						class="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none select-none"
					>
						{value[thumb]}
					</div>
				{/if}
			</SliderPrimitive.Thumb>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
