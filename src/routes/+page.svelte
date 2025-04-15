<script lang="ts">
	import type { PageProps } from "./$types";
	import { onMount, onDestroy } from "svelte";
	import { dataRune } from "$lib/runes/dataRune.svelte";
	import Selection from "$lib/components/Selection.svelte";
	import Map from "$lib/components/Map.svelte";
	import Header from "$lib/components/Header.svelte";

	let { data }: PageProps = $props();

	let leftWidth = $state(28);
	let isResizing = false;
	let mapRef: any;

	onMount(() => {
		if (data.json.length > 0) {
			dataRune.points = data.json;
		}
		window.addEventListener("mousemove", doResize);
		window.addEventListener("mouseup", stopResize);
	});

	onDestroy(() => {
		window.removeEventListener("mousemove", doResize);
		window.removeEventListener("mouseup", stopResize);
	});

	function startResize(event: MouseEvent) {
		isResizing = true;
		event.preventDefault();
	}

	function stopResize() {
		isResizing = false;
		mapRef?.invalidateMapSize?.();
	}

	function doResize(event: MouseEvent) {
		if (isResizing) {
			const newLeftWidth = (event.clientX / window.innerWidth) * 100;
			if (newLeftWidth > 15 && newLeftWidth < 66) {
				leftWidth = newLeftWidth;
			}
		}
	}
</script>

<Header />

<div class="main">
	<div class="left" style="width: {leftWidth}%">
		<Selection />
	</div>
    <button
    class="resizer"
    aria-label="Resize panel"
    onmousedown={startResize}
></button>
	<div class="right" style="width: {100 - leftWidth}%">
		<Map bind:this={mapRef} />
	</div>
</div>

<style>
	.main {
		display: flex;
		height: calc(100vh - 68px);
		overflow: hidden;
	}
	.left,
	.right {
		height: 100%;
		overflow: auto;
	}

    .left {
        background-color: var(--color-background);
        padding: 1rem;
    }
	.resizer {
		all: unset;
		width: 4px;
		cursor: col-resize;
		background-color: var(--color-resizer);
	}
	.resizer:hover {
		background-color: hsl(var(--primary));
	}
</style>
