<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import "leaflet/dist/leaflet.css";
    import { dataRune } from "$lib/runes/dataRune.svelte";
    import * as htmlToImage from "html-to-image";
    import { Button } from "$lib/components/ui/button/index";

    import { Map, Plus, Minus, ImageDown } from "lucide-svelte"; // icône de rafraîchissement

    let mapContainer: HTMLDivElement;
    let map: L.Map;
    let isLoading = $state(true);
    let L: typeof import("leaflet");

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

                marker.bindPopup(`<strong>${point.name ?? "null"}</strong><br>
					City: ${point.city ?? "null"}<br>
					Country: ${point.country ?? "null"}<br>
					Category: ${point.category ?? "null"}<br>
					Type: ${point.type ?? "null"}<br>
					Sector: ${point.sector ?? "null"}<br>
					Source type: ${point.source_type ?? "null"}<br>
					Collection: ${point.data_collection_method ?? "null"}<br>
					Source: ${point.source_text ?? "null"}<br>
					Dataset: ${point.dataset_name ?? "null"}<br>
					PFAS values: ${point.pfas_values ?? "null"} ${point.unit ?? ""}<br>
					PFAS sum: ${point.pfas_sum ?? "null"}<br>
					Matrix: ${point.matrix ?? "null"}<br>
					Date: ${point.date ?? "null"}<br>
					Year: ${point.year ?? "null"}<br>
					<a href="${point.source_url ?? "#"}" target="_blank" rel="noopener">Lien source</a>
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
        }
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
