<script lang="ts">
    import { dataRune } from "$lib/runes/dataRune.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import AreaSelector from "./AreaSelector.svelte";
    import { Separator } from "$lib/components/ui/separator/index";
    import { Slider } from "$lib/components/ui/slider";

    let mode = $state<"nuts" | "lasso">("nuts");

    function toggleSelectAll(field: "datasetId" | "matrix" | "substances") {
        if (field === "datasetId") {
            dataRune.filters.datasetId =
                dataRune.filters.datasetId.length === 0
                    ? dataRune.availableOptions().datasetIds.map((d) => d.id)
                    : [];
        } else if (field === "matrix") {
            dataRune.filters.matrix =
                dataRune.filters.matrix.length === 0
                    ? dataRune.availableOptions().matrices.map((m) => m.name)
                    : [];
        } else if (field === "substances") {
            dataRune.filters.substances =
                dataRune.filters.substances.length === 0
                    ? [...dataRune.allSubstances()]
                    : [];
        }
    }

    function isAllSelected(field: "datasetId" | "matrix" | "substances") {
        return dataRune.filters[field].length === 0;
    }

    $inspect(dataRune.filters.lassoRegion);
</script>

<div class="selection">
    <!-- Catégorie -->
    <h3
        class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
    >
        Data type
    </h3>

    {#if dataRune.categories().length}
        <Select.Root
            type="single"
            bind:value={dataRune.filters.category}
            onValueChange={() => {
                dataRune.filters.datasetId = [];
                dataRune.filters.matrix = [];
            }}
        >
            <Select.Trigger class="w-[220px]">
                {dataRune.filters.category || "Choisir une catégorie"}
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.GroupHeading>Categories</Select.GroupHeading>

                    {#each ["Tous", ...dataRune.categories()] as cat (cat)}
                        <Select.Item value={cat}>{cat}</Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    {/if}

    <!-- <Separator /> -->

    <h3
        class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
    >
        Area selection
    </h3>

    <!-- Mode de sélection -->
    <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-muted-foreground">Mode</span>
        <Button
            variant={mode === "nuts" ? "default" : "outline"}
            onclick={() => (mode = "nuts")}
        >
            NUTS
        </Button>
        <Button
            variant={mode === "lasso" ? "default" : "outline"}
            onclick={() => (mode = "lasso")}
        >
            Lasso
        </Button>
    </div>

    <AreaSelector {mode} />

    <!-- <Separator /> -->

    <!-- Dataset ID -->
    {#if dataRune.availableOptions().datasetIds.length}
        <h3
            class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Dataset
        </h3>
        <div class="button-grid">
            <Button
                variant={isAllSelected("datasetId") ? "default" : "outline"}
                onclick={() => toggleSelectAll("datasetId")}
            >
                Tous
            </Button>

            {#each dataRune.availableOptions().datasetIds as { id, name, count }}
                <Button
                    variant={dataRune.filters.datasetId.includes(id)
                        ? "default"
                        : "outline"}
                    onclick={() => {
                        if (dataRune.filters.datasetId.includes(id)) {
                            dataRune.filters.datasetId =
                                dataRune.filters.datasetId.filter(
                                    (i) => i !== id,
                                );
                        } else {
                            dataRune.filters.datasetId = [
                                ...dataRune.filters.datasetId,
                                id,
                            ];
                        }
                    }}
                >
                    [{id}] {name}
                    <span class="opacity-50 text-xs ml-1">({count})</span>
                </Button>
            {/each}
        </div>
    {/if}

    <!-- <Separator /> -->

    <!-- Matrix -->
    {#if dataRune.filters.category === "Sampling" && dataRune.availableOptions().matrices.length}
        <h2
            class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Matrix
        </h2>
        <div class="button-grid">
            <Button
                variant={isAllSelected("matrix") ? "default" : "outline"}
                onclick={() => toggleSelectAll("matrix")}
            >
                Toutes
            </Button>

            {#each dataRune.availableOptions().matrices as m}
                <Button
                    variant={dataRune.filters.matrix.includes(m.name)
                        ? "default"
                        : "outline"}
                    onclick={() => {
                        if (dataRune.filters.matrix.includes(m.name)) {
                            dataRune.filters.matrix =
                                dataRune.filters.matrix.filter(
                                    (i) => i !== m.name,
                                );
                        } else {
                            dataRune.filters.matrix = [
                                ...dataRune.filters.matrix,
                                m.name,
                            ];
                        }
                    }}
                >
                    {m.name} <span class="opacity-50 text-xs">({m.count})</span>
                </Button>
            {/each}
        </div>
    {/if}

    <!-- <Separator /> -->

    {#if dataRune.filters.category === "Sampling"}
        <h2
            class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Year range
        </h2>
        <div class="my-4 space-y-2 pt-2">
            <Slider
                type="multiple"
                bind:value={dataRune.filters.yearRange}
                min={2000}
                max={2025}
                step={1}
            />
        </div>
    {/if}

    <!-- Substances -->
    {#if dataRune.filters.category === "Sampling"}
        <h2
            class="scroll-m-20 border-b pt-3 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Substances
        </h2>
        <div class="checkbox-scroll">
            <label>
                <input
                    type="checkbox"
                    checked={isAllSelected("substances")}
                    onchange={() => toggleSelectAll("substances")}
                />
                Toutes
            </label>
            {#each dataRune.allSubstances() as substance}
                <label>
                    <input
                        type="checkbox"
                        value={substance}
                        bind:group={dataRune.filters.substances}
                    />
                    {substance}
                </label>
            {/each}
        </div>
    {/if}

    <Separator />

    <Button>Exporter {dataRune.filteredPoints().length} points</Button>
</div>

<style>
    .selection {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .button-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .checkbox-scroll {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-right: 0.5rem;
    }
</style>
