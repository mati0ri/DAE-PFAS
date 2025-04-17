<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import { dataRune } from "$lib/runes/dataRune.svelte";
    import { onMount } from "svelte";

    let open = $state(false);

    let availableFields: string[] = $state([]);
    let selectedFields = $state(new Set<string>());
    let estimatedSize = $state(0);

    $effect(() => {
        if (dataRune.points.length > 0 && availableFields.length === 0) {
            availableFields = Object.keys(dataRune.points[0]).filter(
                (f) => f !== "nuts",
            );
            selectedFields = new Set(availableFields);
            updateEstimatedSize();
        }
    });

    $effect(() => {
        updateEstimatedSize();
    });

    function toggleField(field: string) {
        if (selectedFields.has(field)) {
            selectedFields.delete(field);
        } else {
            selectedFields.add(field);
        }
        selectedFields = new Set(selectedFields); // trigger reactivity
        console.log("Selected fields:", Array.from(selectedFields));
        updateEstimatedSize();
    }

    function updateEstimatedSize() {
        const points = dataRune.filteredPoints();
        if (points.length === 0) {
            estimatedSize = 0;
            return;
        }

        const sample = points.slice(0, 20);
        const csvLines = sample.map((row) =>
            Array.from(selectedFields)
                .map((key) =>
                    JSON.stringify((row as Record<string, any>)[key] ?? ""),
                )
                .join(","),
        );
        const total = csvLines.join("\n").length;
        const estimatedTotal = (total / sample.length) * points.length;
        estimatedSize = Math.round(estimatedTotal / 1024); // in KB
    }

    function exportCSV() {
        const fields = Array.from(selectedFields).filter((f) => f !== "nuts");
        const rows = [fields.join(",")];

        for (const point of dataRune.filteredPoints()) {
            const row = fields.map((key) => {
                const value = (point as Record<string, any>)[key];

                // Pour les champs JSON ou objets/arrays, on stringify proprement
                if (typeof value === "object") {
                    return JSON.stringify(value).replace(/"/g, '""'); // double les guillemets
                }

                const stringValue = value ?? ""; // null -> ""
                const escaped = String(stringValue).replace(/"/g, '""'); // échappe les "
                return `"${escaped}"`; // entoure de guillemets
            });

            rows.push(row.join(","));
        }

        const csvContent = rows.join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "export.csv";
        link.click();
        URL.revokeObjectURL(url);
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger class="w-full">
        <Button class="w-full"
            >Exporter {dataRune.filteredPoints().length} points</Button
        >
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <Dialog.Header>
            <Dialog.Title>Exporter les données</Dialog.Title>
            <Dialog.Description>
                Sélectionne les champs à inclure dans l’export CSV.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-3 py-2">
            {#each availableFields as field (field)}
                <div class="flex items-center gap-3">
                    <Checkbox
                        id={`field-${field}`}
                        checked={selectedFields.has(field)}
                        onCheckedChange={() => toggleField(field)}
                    />
                    <Label for={`field-${field}`}>{field}</Label>
                </div>
            {/each}
        </div>

        <div class="text-sm text-muted-foreground mt-2">
            Taille estimée du fichier : {estimatedSize} KB
        </div>

        <Dialog.Footer>
            <Button onclick={exportCSV}>Exporter</Button>
            <Button variant="ghost" onclick={() => (open = false)}
                >Fermer</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
