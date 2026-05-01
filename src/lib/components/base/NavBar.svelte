<!-- src/lib/components/base/NavBar.svelte -->
<script lang="ts">
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import { afterNavigate } from '$app/navigation';
	import ThemeToggle from './ThemeToggle.svelte';

	let dropdownNavOpen = false;
	let navMenuButton: HTMLElement;

	afterNavigate(() => {
		dropdownNavOpen = false;
	});

	const toggleDropdownNavItems = () => {
		dropdownNavOpen = !dropdownNavOpen;
	};
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-md"
>
	Skip to main content
</a>

<div class="bg-page/85 sticky top-0 z-50 w-full border-b border-subtle backdrop-blur-md">
	<div class="flex w-full justify-center">
		<Navbar
			class="relative w-full max-w-[1350px] !bg-transparent px-4 py-2 sm:px-6 lg:px-8"
			role="navigation"
			aria-label="Main navigation"
		>
			<div class="flex w-full items-center justify-between">
				<NavBrand href="/" class="flex flex-shrink-0 items-center">
					<img src="/myth-map-small.svg" class="h-10 sm:h-12" alt="Tiny Tribe Adventures" />
					<span
						class="ml-2 hidden self-center whitespace-nowrap font-display text-lg font-bold text-primary-700 dark:text-primary-300 sm:block"
					>
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center gap-2">
					<ThemeToggle />
					<NavHamburger
						bind:this={navMenuButton}
						class="text-default hover:text-primary-700 dark:hover:text-primary-300 md:hidden"
						aria-haspopup="true"
						aria-expanded={dropdownNavOpen}
						aria-label="Toggle mobile navigation menu"
						on:click={toggleDropdownNavItems}
					/>
					<Dropdown
						open={dropdownNavOpen}
						class="mt-2 w-48 rounded-sm border border-subtle !bg-surface md:hidden"
						placement="bottom-end"
						role="menu"
					>
						<DropdownItem href="/" class="text-default hover:!bg-sunken hover:text-primary-700">
							Home
						</DropdownItem>
						<DropdownItem
							href="/locations"
							class="text-default hover:!bg-sunken hover:text-primary-700"
						>
							Locations
						</DropdownItem>
						<DropdownItem
							href="/about"
							class="text-default hover:!bg-sunken hover:text-primary-700"
						>
							About us
						</DropdownItem>
					</Dropdown>
				</div>
			</div>

			<NavUl
				class="hidden md:absolute md:left-1/2 md:top-1/2 md:flex md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:transform md:flex-row md:items-center md:justify-center md:space-x-8"
			>
				<NavLi
					href="/"
					class="text-default transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
				>
					Home
				</NavLi>
				<NavLi
					href="/locations"
					class="text-default transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
				>
					Locations
				</NavLi>
				<NavLi
					href="/about"
					class="text-default transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
				>
					About us
				</NavLi>
			</NavUl>
		</Navbar>
	</div>
</div>
