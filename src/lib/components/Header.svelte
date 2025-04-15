<script lang="ts">
    interface Logo {
        src: string;
        url: string;
    }

    const logos: Logo[] = [
        { src: "/logos/LIRMM.png", url: "https://www.lirmm.fr" },
        { src: "/logos/UMd.png", url: "https://www.umontpellier.fr" },
        { src: "/logos/CNRSd.png", url: "https://www.cnrs.fr" },
        { src: "/logos/UMPVd.png", url: "https://www.univ-montp3.fr" },
    ];
</script>

<header>
    <div class="logo-row">
        <div class="logos">
            {#each logos as logo}
                <a href={logo.url} target="_blank" rel="noopener noreferrer">
                    <img src={logo.src} alt="Logo partenaire" />
                </a>
            {/each}
        </div>
        <h2
        class="scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
      >
        LIRMM PFAS Data Hub
      </h2>
    </div>
</header>

<style>
    header {
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 1rem 2rem;
    }

    .logo-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .logos {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .logos img {
        height: 30px;
        object-fit: contain;
        transition: opacity 0.2s;
    }

    .logos a:hover img {
        opacity: 0.6;
    }
</style>
