<!-- src/lib/components/base/NavBar.svelte -->
<script lang="ts">
	import { Navbar, NavBrand, NavLi, NavUl } from 'flowbite-svelte';
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let dropdownNavOpen = false;
	let mobileMenuButton: HTMLButtonElement;

	afterNavigate(() => {
		dropdownNavOpen = false;
	});

	const toggleDropdownNavItems = () => {
		dropdownNavOpen = !dropdownNavOpen;
	};

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !dropdownNavOpen) return;
		dropdownNavOpen = false;
		void tick().then(() => mobileMenuButton?.focus());
	}
</script>

<svelte:window on:keydown={handleWindowKeydown} />

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
				<NavBrand
					href="/"
					class="flex flex-shrink-0 items-center"
					aria-label="Tiny Tribe Adventures home"
				>
					<img
						src="/myth-map.svg"
						class="h-9 w-9 dark:invert sm:h-10 sm:w-10"
						width="40"
						height="40"
						alt=""
						aria-hidden="true"
					/>
					<span
						class="ml-2 hidden self-center whitespace-nowrap font-display text-lg font-bold text-primary-700 dark:text-primary-300 sm:block"
					>
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center gap-2">
					<ThemeToggle />
					<button
						bind:this={mobileMenuButton}
						type="button"
						class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-transparent text-default transition-colors duration-fast hover:border-strong hover:text-primary-700 dark:hover:text-primary-300 md:hidden"
						aria-expanded={dropdownNavOpen}
						aria-controls="mobile-navigation"
						aria-label={dropdownNavOpen ? 'Close main menu' : 'Open main menu'}
						on:click={toggleDropdownNavItems}
					>
						<svg
							class="h-6 w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>

			{#if dropdownNavOpen}
				<nav
					id="mobile-navigation"
					class="absolute right-4 top-full mt-2 w-48 rounded-sm border border-subtle bg-surface p-1 shadow-lg md:hidden"
					aria-label="Mobile navigation"
				>
					<ul class="space-y-1">
						{#each [{ href: '/', label: 'Home' }, { href: '/locations', label: 'Locations' }, { href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }] as item}
							<li>
								<a
									href={item.href}
									class="flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-default transition-colors duration-fast hover:bg-sunken hover:text-primary-700 dark:hover:text-primary-300"
								>
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			{/if}

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
					About
				</NavLi>
				<NavLi
					href="/contact"
					class="text-default transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
				>
					Contact
				</NavLi>
			</NavUl>
		</Navbar>
	</div>
</div>
