// src/lib/utils/dateUtils.ts

export function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toLocaleDateString(undefined, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC' // Assume the date is stored in UTC
	});
}

export function formatTime(time: string | null): string {
	if (!time) {
		time = getCurrentTime();
	}
	const [hours, minutes] = time.split(':');
	const date = new Date();
	date.setHours(parseInt(hours, 10), parseInt(minutes, 10));

	return date.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}

export function formatDateTimeRange(
	startDate: string,
	endDate: string,
	startTime?: string | null,
	endTime?: string | null
): string {
	const start = new Date(startDate);
	const end = new Date(endDate);

	let result = formatDate(start);

	if (startTime) {
		result += ' at ' + formatTime(startTime);
	}

	if (endDate !== startDate) {
		result += ' - ' + formatDate(end);
	}

	if (endTime && endTime !== startTime) {
		result += (endDate === startDate ? ' - ' : ' at ') + formatTime(endTime);
	}

	return result;
}

export function getCurrentTime(): string {
	const now = new Date();
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function ensureTimeNotBeforeCurrent(time: string | null): string {
	const currentTime = getCurrentTime();
	if (!time || time < currentTime) {
		return currentTime;
	}
	return time;
}
