<!-- src/routes/content-board/+layout.svelte -->
<script lang="ts">
</script>

<main class="main flexrate column">
	<slot />
</main>

<style lang="scss">
	.column {
		overflow: auto;
	}
	.jumbo-name {
		position: relative;
		font-size: 3.25rem;
		margin: 1rem;
		text-align: center;
		text-transform: uppercase;
	}

	.column-width {
		max-width: 64rem;
		border-radius: var(--base-border-radius);
	}

	.pos-rel {
		position: relative;
		// overflow: hidden;
	}

	main > a {
		display: inline-block;
		align-items: center;
		color: #260958;
		&::after {
			content: '';
			background-image: url(/icons/arrow.svg);
			display: inline-block;
			vertical-align: middle;
			align-items: center;
			width: 1em;
			height: 1em;
			background-size: 1em 1em;
		}
	}

	.flexrate {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: visible;
	}

	@media (min-width: 1200px) {
		.column {
			overflow: hidden;
			width: 70vw;
		}
		.column-width {
			width: 70vw;
			max-width: 100%;
			border-radius: var(--base-border-radius);
		}
	}
</style>
