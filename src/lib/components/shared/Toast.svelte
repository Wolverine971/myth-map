<!-- src/lib/components/shared/Toast.svelte -->
<script lang="ts">
	import { notifications } from '$lib/components/shared/notifications';
</script>

<div class="notifications">
	{#each $notifications as notification (notification?.id)}
		<div
			class="toast toast--{notification.type}"
			role={notification.type === 'danger' ? 'alert' : 'status'}
			aria-live={notification.type === 'danger' ? 'assertive' : 'polite'}
			aria-atomic="true"
		>
			<div class="content">{notification.message}</div>
			{#if notification.icon}<i class={notification.icon} aria-hidden="true"></i>{/if}
			<button
				type="button"
				class="dismiss"
				aria-label="Dismiss notification"
				on:click={() => notifications.dismiss(notification.id)}
			>
				<span aria-hidden="true">×</span>
			</button>
		</div>
	{/each}
</div>

<style>
	.notifications {
		position: fixed;
		top: 10px;
		left: 0;
		right: 0;
		margin: 10px;
		padding: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-end;
		pointer-events: none;
	}

	.toast {
		flex: 0 0 auto;
		display: flex;
		align-items: flex-start;
		margin-bottom: 10px;
		max-width: min(28rem, calc(100vw - 2.5rem));
		border: 1px solid var(--border-strong);
		border-left: 4px solid var(--text-subtle);
		border-radius: 4px;
		background: var(--surface-elevated);
		box-shadow: 0 12px 28px rgba(1, 68, 33, 0.14);
		color: var(--text-default);
		pointer-events: auto;
	}

	.toast--success {
		border-left-color: theme('colors.primary.500');
	}

	.toast--info {
		border-left-color: theme('colors.accent.800');
	}

	.toast--warning {
		border-left-color: theme('colors.tertiary.600');
	}

	.toast--danger {
		border-left-color: theme('colors.danger.500');
	}

	.content {
		flex: 1;
		padding: 0.75rem 1rem;
		display: block;
		color: var(--text-default);
		font-size: 0.875rem;
		line-height: 1.5;
		font-weight: 500;
	}

	.dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		flex: 0 0 auto;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
	}

	.dismiss:hover {
		color: var(--text-default);
		background: var(--surface-sunken);
	}
</style>
