import { writable, derived } from 'svelte/store';

const DEFAULT_TIMEOUT = 3000;

type NotificationType = 'default' | 'danger' | 'warning' | 'info' | 'success';

interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	timeout: number;
}

function createNotificationStore(defaultTimeout: number) {
	const _notifications = writable<Notification[]>([]);

	function send(message: string, type: NotificationType = 'default', timeout: number = defaultTimeout) {
		_notifications.update(state => {
			return [...state, { id: id(), type, message, timeout }];
		});
	}

	const notifications = derived(_notifications, ($_notifications, set) => {
		set($_notifications);
		if ($_notifications.length > 0) {
			const timer = setTimeout(() => {
				_notifications.update(state => {
					state.shift();
					return state;
				});
			}, $_notifications[0].timeout);
			return () => {
				clearTimeout(timer);
			};
		}
	});

	const { subscribe } = notifications;

	return {
		subscribe,
		send,
		default: (msg: string, timeout?: number) => send(msg, 'default', timeout),
		danger: (msg: string, timeout?: number) => send(msg, 'danger', timeout),
		warning: (msg: string, timeout?: number) => send(msg, 'warning', timeout),
		info: (msg: string, timeout?: number) => send(msg, 'info', timeout),
		success: (msg: string, timeout?: number) => send(msg, 'success', timeout),
	};
}

function id(): string {
	return '_' + Math.random().toString(36).substr(2, 9);
}

export const notifications = createNotificationStore(DEFAULT_TIMEOUT);