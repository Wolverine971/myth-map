// src/lib/components/map/map-popup.ts

export type PopupProperties = {
	name?: string;
	address_line_1?: string;
	city?: string;
	state?: string;
	zip_code?: string;
	website?: string;
};

export function buildAddress(props: PopupProperties): string {
	const street = (props.address_line_1 || '').trim();
	const city = (props.city || '').trim();
	const state = (props.state || '').trim();
	const zip = (props.zip_code || '').trim();
	const cityStateZip = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
	return [street, cityStateZip].filter(Boolean).join(', ');
}

export function buildDetailsLink(props: PopupProperties): string {
	if (!props.state || !props.city || !props.name) return '#';
	const slug = (s: string) => s.replace(/\s+/g, '-');
	return `/locations/states/${props.state}/${slug(props.city)}/${slug(props.name)}`;
}

function escapeHTML(value: string): string {
	return value.replace(/[&<>"']/g, (c) => {
		switch (c) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '"':
				return '&quot;';
			default:
				return '&#39;';
		}
	});
}

const ARROW_RIGHT = `
	<svg class="popup-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
	</svg>`;

const EXTERNAL_LINK = `
	<svg class="popup-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
	</svg>`;

const COPY_ICON = `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<rect x="9" y="9" width="13" height="13" rx="2"/>
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
	</svg>`;

export function buildPopupHTML(props: PopupProperties, copyButtonId: string): string {
	const name = escapeHTML(props.name || 'Unknown Location');
	const address = buildAddress(props);
	const detailsLink = buildDetailsLink(props);
	const website = props.website?.trim();

	const websiteButton = website
		? `<a class="popup-btn popup-btn-secondary" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">
				<span>Website</span>${EXTERNAL_LINK}
			</a>`
		: '';

	const addressBlock = address
		? `<div class="popup-address-row">
				<p class="popup-address">${escapeHTML(address)}</p>
				<button type="button" id="${copyButtonId}" class="popup-copy-btn" aria-label="Copy address">${COPY_ICON}</button>
			</div>`
		: '';

	return `
		<div class="popup-content">
			<h3 class="popup-title">${name}</h3>
			${addressBlock}
			<div class="popup-actions">
				<a class="popup-btn popup-btn-primary" href="${detailsLink}">
					<span>View Details</span>${ARROW_RIGHT}
				</a>
				${websiteButton}
			</div>
		</div>
	`;
}
