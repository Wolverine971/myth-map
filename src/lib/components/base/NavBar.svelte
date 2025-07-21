<!-- src/lib/components/base/NavBar.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Button,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { invalidateAll } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';
	import { afterNavigate } from '$app/navigation';

	export let user: any = null;

	let dropdownOpen = false;
	let dropdownNavOpen = false;
	let accountMenuButton: HTMLElement;
	let navMenuButton: HTMLElement;

	afterNavigate(() => {
		closeDropdown();
	});

	const handleLogout = async () => {
		try {
			const body = new FormData();
			const response = await fetch('/account?/logout', { method: 'POST', body });

			/** @type {import('@sveltejs/kit').ActionResult} */
			const result = deserialize(await response.text());

			if (result.type === 'success') {
				// rerun all `load` functions, following the successful update
				await invalidateAll();
			}

			applyAction(result);
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			closeDropdown();
		}
	};

	const toggleDropdown = () => {
		dropdownOpen = !dropdownOpen;
	};

	const closeDropdown = () => {
		dropdownOpen = false;
	};

	const toggleDropdownNavItems = () => {
		dropdownNavOpen = !dropdownNavOpen;
	};

	const closeNavDropdown = () => {
		dropdownNavOpen = false;
	};

	// Keyboard navigation handlers
	const handleAccountMenuKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleDropdown();
		} else if (event.key === 'Escape' && dropdownOpen) {
			closeDropdown();
			accountMenuButton?.focus();
		} else if (event.key === 'ArrowDown' && dropdownOpen) {
			event.preventDefault();
			const firstItem = document.querySelector('[data-dropdown-item="account"]') as HTMLElement;
			firstItem?.focus();
		}
	};

	const handleNavMenuKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleDropdownNavItems();
		} else if (event.key === 'Escape' && dropdownNavOpen) {
			closeNavDropdown();
			navMenuButton?.focus();
		} else if (event.key === 'ArrowDown' && dropdownNavOpen) {
			event.preventDefault();
			const firstItem = document.querySelector('[data-dropdown-item="nav"]') as HTMLElement;
			firstItem?.focus();
		}
	};

	const handleDropdownItemKeydown = (event: KeyboardEvent, action: () => void) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		} else if (event.key === 'Escape') {
			closeDropdown();
			closeNavDropdown();
			accountMenuButton?.focus() || navMenuButton?.focus();
		}
	};
</script>

<!-- Skip Navigation Link -->
<a 
	href="#main-content" 
	class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
>
	Skip to main content
</a>

<div
	class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-all duration-300 dark:bg-primary-900/80"
>
	<div class="flex w-full justify-center">
		<Navbar class="relative w-full max-w-[1350px] px-4 py-2 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
			<div class="flex w-full items-center justify-between">
				<NavBrand href="/" class="flex flex-shrink-0 items-center transition-all duration-300">
					<img
						src="/myth-map-small.svg"
						class="h-10 transition-all duration-300 sm:h-12"
						alt="Tiny Tribe Adventures"
					/>
					<span
						class="ml-2 hidden self-center whitespace-nowrap text-lg font-semibold text-primary-700 transition-all duration-300 sm:block dark:text-white"
					>
						Tiny Tribe Adventures
					</span>
				</NavBrand>

				<div class="flex flex-shrink-0 items-center space-x-2">
					{#if user}
						<div class="relative">
							<Button
								bind:this={accountMenuButton}
								color="primary"
								class="!p-2 transition-all duration-300 hover:bg-primary-600"
								id="account-menu-button"
								aria-haspopup="true"
								aria-expanded={dropdownOpen}
								aria-label="User account menu"
								on:click={toggleDropdown}
								on:keydown={handleAccountMenuKeydown}
							>
								<UserSolid class="h-5 w-5" />
							</Button>
							<Dropdown 
								open={dropdownOpen} 
								class="mt-2 w-44" 
								on:click={closeDropdown} 
								placement="bottom-end"
								role="menu"
								aria-labelledby="account-menu-button"
							>
								<DropdownItem 
									href="/account" 
									class="flex items-center text-primary-700 hover:bg-primary-50"
									data-dropdown-item="account"
									role="menuitem"
									tabindex={dropdownOpen ? 0 : -1}
									on:keydown={(e) => handleDropdownItemKeydown(e, () => window.location.href = '/account')}
								>
									<UserSolid class="mr-2 h-4 w-4" />
									Account
								</DropdownItem>
								<DropdownItem 
									on:click={handleLogout} 
									class="text-primary-700 hover:bg-primary-50"
									role="menuitem"
									tabindex={dropdownOpen ? 0 : -1}
									on:keydown={(e) => handleDropdownItemKeydown(e, handleLogout)}
								>
									Logout
								</DropdownItem>
							</Dropdown>
						</div>
					{:else}
						<div class="flex space-x-2">
							<Button
								href="/login"
								color="primary"
								class="transition-all duration-300 hover:bg-primary-600"
							>
								Login / Register
							</Button>
						</div>
					{/if}
					<NavHamburger
						bind:this={navMenuButton}
						class="text-primary-700 transition-all duration-300 hover:text-primary-600 md:hidden"
						id="nav-menu-button"
						aria-haspopup="true"
						aria-expanded={dropdownNavOpen}
						aria-label="Toggle mobile navigation menu"
						on:click={toggleDropdownNavItems}
						on:keydown={handleNavMenuKeydown}
					/>
					<Dropdown
						open={dropdownNavOpen}
						class="mt-2 w-48 md:hidden"
						on:click={closeNavDropdown}
						placement="bottom-end"
						role="menu"
						aria-labelledby="nav-menu-button"
					>
						<DropdownItem 
							href="/" 
							class="flex items-center text-primary-700 hover:bg-primary-50"
							data-dropdown-item="nav"
							role="menuitem"
							tabindex={dropdownNavOpen ? 0 : -1}
							on:keydown={(e) => handleDropdownItemKeydown(e, () => window.location.href = '/')}
						>
							Home
						</DropdownItem>
						<DropdownItem 
							href="/locations" 
							class="flex items-center text-primary-700 hover:bg-primary-50"
							role="menuitem"
							tabindex={dropdownNavOpen ? 0 : -1}
							on:keydown={(e) => handleDropdownItemKeydown(e, () => window.location.href = '/locations')}
						>
							Locations
						</DropdownItem>
						<DropdownItem 
							href="/about" 
							class="flex items-center text-primary-700 hover:bg-primary-50"
							role="menuitem"
							tabindex={dropdownNavOpen ? 0 : -1}
							on:keydown={(e) => handleDropdownItemKeydown(e, () => window.location.href = '/about')}
						>
							About us
						</DropdownItem>
					</Dropdown>
				</div>
			</div>

			<NavUl
				class="hidden md:absolute md:left-1/2 md:top-1/2 md:flex md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:transform md:flex-row md:items-center md:justify-center md:space-x-8"
			>
				<NavLi href="/" class="text-gray-700 transition-all duration-300 hover:text-primary-600">
					Home
				</NavLi>
				<NavLi href="/locations" class="text-gray-700 transition-all duration-300 hover:text-primary-600">
					Locations
				</NavLi>
				<NavLi href="/about" class="text-gray-700 transition-all duration-300 hover:text-primary-600">
					About us
				</NavLi>
			</NavUl>
		</Navbar>
	</div>
</div>
