<script lang="ts">
    import * as d3 from "d3";
    import * as Select from "$lib/components/ui/select";
    import { dataRune } from "$lib/runes/dataRune.svelte";
    import { Button } from "$lib/components/ui/button";

    let selectedYear = $state("2024");
    let selectedLevel = $state("0");
    let container: HTMLDivElement;
    let geojsonData: any = null;
    let worldGeojson: any = null;

    let selectedRegions: string[] = $state([]);

    async function loadAndRenderMap() {
        const nutsUrl = `/data/nuts/NUTS_${selectedYear}.geojson`;
        const worldUrl = `/data/world2.geojson`;

        selectedRegions = [];
        dataRune.filters.nutsRegions = [];

        geojsonData = await d3.json(nutsUrl);
        worldGeojson = await d3.json(worldUrl);

        renderMap();
    }

    function renderMap() {
        d3.select(container).select("svg").remove();

        const svg = d3
            .select(container)
            .append("svg")
            .attr("viewBox", "0 0 1000 700")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%");

        const projection = d3
            .geoConicConformal()
            .center([11, 50])
            .scale(1800)
            .translate([500, 350]);

        const path = d3.geoPath().projection(projection);

        // === 🌍 Ajout de la couche monde en fond ===
        svg.append("g")
            .attr("class", "world-background")
            .selectAll("path")
            .data(worldGeojson.features)
            .join("path")
            .attr("d", (d: any) => path(d) as string)
            .attr("fill", "var(--color-land)")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.3)
            .attr("opacity", 0.4);

        // === Couches NUTS ===
        const g = svg.append("g");

        const features = geojsonData.features.filter(
            (f: any) => f.properties.LEVL_CODE === +selectedLevel,
        );

        g.selectAll("path")
            .data(features)
            .join("path")
            .attr("d", (d: any) => path(d) as string)
            .attr("data-id", (d: any) => d.properties.NUTS_ID)

            .attr("fill", (d: any) =>
                selectedRegions.includes(d.properties.NUTS_ID)
                    ? "var(--primary)"
                    : "var(--color-countries)",
            )
            .attr("stroke", "#444")
            .attr("stroke-width", 0.6)
            .attr("opacity", 0.85)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d: any) {
                const id = d.properties.NUTS_ID;
                d3.select(this).attr(
                    "fill",
                    selectedRegions.includes(id)
                        ? "var(--color-primary-hover)"
                        : "var(--color-land-hover)",
                );
            })

            .on("mouseout", function () {
                d3.select(this).attr("fill", (d: any) =>
                    selectedRegions.includes(d.properties.NUTS_ID)
                        ? "var(--primary)"
                        : "var(--color-countries)",
                );
            })
            .on("click", (event, d: any) => {
                const element = this as SVGPathElement;
                const id = d.properties.NUTS_ID;

                if (selectedRegions.includes(id)) {
                    selectedRegions = selectedRegions.filter((r) => r !== id);
                } else {
                    selectedRegions = [...selectedRegions, id];
                }
                updateSelectedRegionsInRune();
                d3.select(element).attr(
                    "fill",
                    selectedRegions.includes(id)
                        ? "var(--primary)"
                        : "var(--color-countries)",
                );
            });

        svg.call(
            d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
                g.attr("transform", event.transform);
                svg.select(".world-background").attr(
                    "transform",
                    event.transform,
                );
            }),
        );
    }

    function updateSelectedRegionsInRune() {
        dataRune.filters.nutsRegions = selectedRegions.map((id) => ({
            id,
            year: Number(selectedYear),
            level: Number(selectedLevel),
        }));
    }

    $effect(() => {
        if (selectedYear && selectedLevel) {
            loadAndRenderMap();
        }
    });
</script>

<div class="map-filter-layout">
    <h3
        class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
    >
        Area restriction
    </h3>

    <!-- Filtres NUTS -->
    <div class="nuts-controls">
        <Select.Root bind:value={selectedYear} type="single">
            <Select.Trigger class="w-[160px]"
                >NUTS {selectedYear}</Select.Trigger
            >
            <Select.Content>
                {#each ["2016", "2021", "2024"] as y}
                    <Select.Item value={y}>{y}</Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>

        <Select.Root bind:value={selectedLevel} type="single">
            <Select.Trigger class="w-[160px]"
                >Niveau {selectedLevel}</Select.Trigger
            >
            <Select.Content>
                {#each ["0", "1", "2", "3"] as l}
                    <Select.Item value={l}>Niveau {l}</Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <!-- Carte -->
    <div class="map-stack">
        <div bind:this={container} class="map-layer"></div>
    </div>

    <!-- Liste des régions sélectionnées -->
    <div class="region-list">
        <div class="flex flex-wrap gap-2 pl-2">
            {#each selectedRegions as region (region)}
                <Button
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => {
                        selectedRegions = selectedRegions.filter((r) => r !== region);
                        updateSelectedRegionsInRune();
                        d3.select(`path[data-id="${region}"]`).attr(
                            "fill",
                            "var(--color-countries)",
                        );
                    }}
                >
                    {region} ✕
                </Button>
            {/each}
        </div>
        
        {#if selectedRegions.length === 0}
            <p class="text-muted-foreground text-sm">
                Select an area to start geographical restriction
            </p>
        {/if}
    </div>
</div>

<style>
    .map-filter-layout {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .nuts-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: flex-start;
    }

    .map-stack {
        position: relative;
        width: 100%;
        aspect-ratio: 9 / 7;
        border: 1px solid #e3e3e3;
        border-radius: 0.5rem;
        overflow: hidden;
        min-height: 300px;
        cursor: grab; /* main ouverte par défaut */
    }

    .map-layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    .region-list {
        width: 100%;
    }

    .region-list ul {
        margin: 0;
        padding-left: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .region-list button {
        background: none;
        border: none;
        color: hsl(var(--primary));
        cursor: pointer;
    }

    .region-list button:hover {
        text-decoration: underline;
    }
</style>
