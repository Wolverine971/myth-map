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
	const { address_line_1 = '', city = '', state = '', zip_code = '' } = props;
	return `${address_line_1}, ${city}, ${state} ${zip_code}`.trim();
}

export function buildDetailsLink(props: PopupProperties): string {
	if (!props.state || !props.city || !props.name) return '#';
	const slug = (s: string) => s.replace(/\s+/g, '-');
	return `/locations/states/${props.state}/${slug(props.city)}/${slug(props.name)}`;
}

export function buildPopupHTML(props: PopupProperties, copyButtonId: string): string {
	const name = props.name || 'Unknown Location';
	const address = buildAddress(props);
	const detailsLink = buildDetailsLink(props);
	const websiteButton = props.website
		? `<a class="popup-btn popup-btn-secondary" href="${props.website}" target="_blank" rel="noopener noreferrer">
				<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<path d="M2 12h20"></path>
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
				</svg>
				Website
			</a>`
		: '';

	return `
		<div class="popup-content">
			<h3 class="popup-title">${name}</h3>

			<div class="popup-address-section">
				<div class="popup-address-header">
					<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
						<circle cx="12" cy="10" r="3"></circle>
					</svg>
					<span class="popup-label">Address</span>
				</div>
				<p class="popup-address">${address}</p>
				<button type="button" id="${copyButtonId}" class="popup-btn popup-btn-copy">
					<svg class="popup-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
					Copy
				</button>
			</div>

			<div class="popup-actions">
				<a class="popup-btn popup-btn-primary" href="${detailsLink}">
					<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 11l3 3L22 4"></path>
						<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
					</svg>
					View Details
				</a>
				${websiteButton}
			</div>
		</div>
	`;
}
