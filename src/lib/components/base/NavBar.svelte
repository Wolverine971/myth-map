<script>
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button } from 'flowbite-svelte';
	import { UserSolid } from 'flowbite-svelte-icons';
	$: activeUrl = $page.url.pathname;
	export let innerWidth = 0;
</script>

<Navbar let:hidden let:toggle>
	<NavBrand href="/">
		<img src="/myth-map-small.svg" class="me-3 h-14 sm:h-20" alt="Tiny Tribe Adventures" />
		{#if $page.url.pathname !== '/' || innerWidth < 500}
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
				>Tiny Tribe Adventures</span
			>
		{/if}
	</NavBrand>

	<div class="flex md:order-2">
		<Button href="/account" color="light" class="!p-2">
			<UserSolid class="h-5 w-5" />
		</Button>
		<NavHamburger on:click={toggle} />
	</div>

	<NavUl {activeUrl} {hidden}>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/locations">Locations</NavLi>
		<NavLi href="/about">About us</NavLi>
		<NavLi href="/contact">Contact</NavLi>
	</NavUl>
</Navbar>
