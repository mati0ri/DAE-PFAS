<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import "leaflet/dist/leaflet.css";
    import { dataRune } from "$lib/runes/dataRune.svelte";
    import * as htmlToImage from "html-to-image";
    import { Button } from "$lib/components/ui/button/index";
    import "leaflet-lasso";
    import { Map, Plus, Minus, ImageDown } from "lucide-svelte"; // icône de rafraîchissement

    let mapContainer: HTMLDivElement;
    let map: L.Map;
    let isLoading = $state(true);
    let L: typeof import("leaflet");

    let lasso: any;

    $effect(() => {
        if (dataRune.lassoEnabled) {
            if (map && !lasso) {
                lasso = new (L as any).Lasso(map, {
                    intersect: true,
                    polygon: { color: "var(--primary)" },
                });

                map.on("lasso.finished", (event: any) => {
                    const rawPolygon = event?.latLngs;

                    if (Array.isArray(rawPolygon)) {
                        dataRune.filters.lassoRegion = rawPolygon.map(
                            ({ lat, lng }: { lat: number; lng: number }) => ({
                                lat,
                                lon: lng,
                            }),
                        );
                    } else {
                        console.warn(
                            "Lasso event.latLngs not found or malformed",
                            event,
                        );
                        dataRune.filters.lassoRegion = [];
                    }

                    dataRune.lassoEnabled = false;
                });

                lasso.enable();
            }
        } else if (lasso) {
            lasso.disable();
            map.off("lasso.finished");
            lasso = null;
            dataRune.lassoEnabled = false;
            // dataRune.filters.lassoRegion = [];
        }
    });

    export function invalidateMapSize() {
        // quand on resize, la map se recharge
        map?.invalidateSize();
    }

    function getColor(
        category: string,
        pfas_sum: number | string | null | undefined,
    ): string {
        if (category === "Sampling") {
            let value: number | null = null;
            if (typeof pfas_sum === "number" && !isNaN(pfas_sum)) {
                value = pfas_sum;
            } else if (
                typeof pfas_sum === "string" &&
                !isNaN(parseFloat(pfas_sum))
            ) {
                value = parseFloat(pfas_sum);
            }
            if (value === null) return "#888888";
            if (value < 10) return "#FFFFFF";
            if (value < 100) return "#FFFF00";
            if (value < 1000) return "#FFA500";
            if (value < 10000) return "#FF0000";
            return "#000000";
        }
        switch (category) {
            case "Presumptive":
                return "#40E0D0";
            case "Known PFAS user":
                return "#FFD700";
            case "PFAS production facility":
                return "#FF00FF";
            default:
                return "#888888";
        }
    }

    function exportMapAsPng() {
        if (!mapContainer) return;

        htmlToImage
            .toPng(mapContainer, {
                pixelRatio: 4,
                style: {
                    margin: "0",
                    padding: "0",
                    background: "transparent",
                    boxShadow: "none",
                    border: "none",
                },
                filter: (node) => {
                    const id = (node as HTMLElement).id;
                    return id !== "some-ui" && id !== "export-btn";
                },
            })
            .then((dataUrl) => {
                const link = document.createElement("a");
                link.download = "pfas-map.png";
                link.href = dataUrl;
                link.click();
            })
            .catch((error) => {
                console.error("Export erreur :", error);
            });
    }

    async function updateMap() {
        const points = dataRune.filteredPoints();
        const startTime = performance.now();

        isLoading = true;

        const canvasRenderer = L.canvas();

        map.eachLayer((layer) => {
            if ((layer as L.CircleMarker).getLatLng) {
                map.removeLayer(layer);
            }
        });

        if (!points?.length) {
            isLoading = false;
            return;
        }

        for (const point of points) {
            const lat = parseFloat(point.lat);
            const lon = parseFloat(point.lon);
            const color = getColor(point.category ?? "", point.pfas_sum);

            if (!isNaN(lat) && !isNaN(lon)) {
                const marker = L.circleMarker([lat, lon], {
                    radius: 4,
                    fillColor: color,
                    color: "grey",
                    weight: 0.7,
                    fillOpacity: 1,
                    renderer: canvasRenderer,
                });

                const parsedValues = (() => {
                    try {
                        return JSON.parse(point.pfas_values ?? "[]");
                    } catch {
                        return [];
                    }
                })();

                const styleTable =
                    "width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 0.5rem;";
                const styleTh =
                    "border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9; text-align: left;";
                const styleTd = "border: 1px solid #ccc; padding: 4px;";
                const muted = "color: var(--muted); font-style: italic;";

                const pfasTable = parsedValues.length
                    ? `<table style="${styleTable}">
		<thead>
			<tr>
				<th style="${styleTh}">Substance</th>
				<th style="${styleTh}">Value</th>
				<th style="${styleTh}">Unit</th>
			</tr>
		</thead>
		<tbody>
			${parsedValues
                .map((v: any) => {
                    const substance =
                        v.substance ?? `<span style="${muted}">null</span>`;
                    const value =
                        v.value ??
                        v.less_than ??
                        `<span style="${muted}">null</span>`;
                    const unit =
                        v.unit ??
                        point.unit ??
                        `<span style="${muted}">null</span>`;
                    return `<tr>
						<td style="${styleTd}">${substance}</td>
						<td style="${styleTd}">${value}</td>
						<td style="${styleTd}">${unit}</td>
					</tr>`;
                })
                .join("")}
		</tbody>
	</table>`
                    : `<div style="${muted}">No PFAS values</div>`;

                marker.bindPopup(`
	<div style="font-family: sans-serif; font-size: 0.85rem;">
		<h2 class="text-lg font-semibold mb-1">${point.name ?? `<span style="${muted}">null</span>`}</h2>
		<div><strong>City:</strong> ${point.city ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Country:</strong> ${point.country ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Category:</strong> ${point.category ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Type:</strong> ${point.type ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Sector:</strong> ${point.sector ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Source type:</strong> ${point.source_type ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Collection:</strong> ${point.data_collection_method ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Source:</strong> ${point.source_text ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Dataset:</strong> [${point.dataset_id ?? `<span style="${muted}">null</span>`}] ${point.dataset_name ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Matrix:</strong> ${point.matrix ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Date:</strong> ${point.date ?? `<span style="${muted}">null</span>`}</div>
		<div><strong>Year:</strong> ${point.year ?? `<span style="${muted}">null</span>`}</div>

		${pfasTable}
                <div style="margin-top: 0.4rem;"><strong>PFAS sum:</strong> ${point.pfas_sum ?? `<span style="${muted}">null</span>`}</div>

		<div style="margin-top: 0.4rem;">
			<a href="${point.source_url ?? "#"}" target="_blank" rel="noopener" class="text-blue-600 underline">
				Lien source
			</a>
		</div>
	</div>
`);

                marker.addTo(map);
            }
        }

        isLoading = false;
        const endTime = performance.now();
        console.log(
            `Map rendered in ${((endTime - startTime) / 1000).toFixed(2)} seconds`,
        );
    }

    let tileLayerIndex = $state(0);
    let currentTileLayer: L.TileLayer | null = null;

    const tileLayers = [
        {
            name: "OpenStreetMap",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        },
        {
            name: "Carto Light",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            attribution:
                '&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap',
        },
    ];

    function switchTileLayer() {
        tileLayerIndex = (tileLayerIndex + 1) % tileLayers.length;

        if (currentTileLayer) {
            map.removeLayer(currentTileLayer);
        }

        const base = tileLayers[tileLayerIndex];
        currentTileLayer = L.tileLayer(base.url, {
            attribution: base.attribution,
        }).addTo(map);
    }

    onMount(async () => {
        L = await import("leaflet");

        map = L.map(mapContainer, {
            preferCanvas: true,
            zoomControl: false,
        }).setView([48, 7], 5);

        const base = tileLayers[tileLayerIndex];
        currentTileLayer = L.tileLayer(base.url, {
            attribution: base.attribution,
        }).addTo(map);

        updateMap();
    });

    onDestroy(() => {
        map?.remove();
    });

    $effect(() => {
        updateMap();
    });
</script>

<div class="map-wrapper">
    {#if isLoading}
        <div class="loader">Récupération des données...</div>
    {/if}
    <div bind:this={mapContainer} class="map"></div>
    <Button
        onclick={() => map.zoomIn()}
        size="icon"
        class="absolute top-4 left-4 z-[1001]"
        title="Zoom avant"
    >
        <Plus class="w-4 h-4" />
    </Button>

    <Button
        onclick={() => map.zoomOut()}
        size="icon"
        class="absolute top-16 left-4 z-[1001]"
        title="Zoom arrière"
    >
        <Minus class="w-4 h-4" />
    </Button>

    <Button
        onclick={switchTileLayer}
        size="icon"
        class="absolute top-28 left-4 z-[1001]"
        title="Changer de fond de carte"
    >
        <Map class="w-4 h-4" />
    </Button>
    <Button
        onclick={exportMapAsPng}
        size="icon"
        class="absolute top-40 left-4 z-[1001]"
        title="Exporter la carte"
    >
        <ImageDown class="w-4 h-4" />
    </Button>
</div>

<style>
    .map-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .map {
        width: 100%;
        height: 100%;
    }

    .loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-background);
        color: var(--color-text);
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: bold;
        font-size: 1.2rem;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    :global(.leaflet-container) {
        height: 100%;
        width: 100%;
        z-index: 0;
    }
</style>
