// src/lib/components/map/FullscreenControl.ts
import type { IControl, Map } from 'mapbox-gl';

export class FullscreenControl implements IControl {
	private _fullscreen = false;
	private _map?: Map;
	private _container!: HTMLElement;
	private _button!: HTMLButtonElement;
	private _icon!: HTMLSpanElement;
	private _originalStyles: Record<string, string> = {};

	onAdd(map: Map) {
		this._map = map;
		this._container = document.createElement('div');
		this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this._button = document.createElement('button');
		this._button.className = 'fullscreen-button';
		this._button.setAttribute('aria-label', 'Toggle fullscreen map');
		this._icon = document.createElement('span');
		this._icon.className = 'fullscreen-icon';
		this._button.appendChild(this._icon);
		this._container.appendChild(this._button);
		this._button.addEventListener('click', () => this.toggleFullscreen());
		return this._container;
	}

	onRemove() {
		this._container.parentNode?.removeChild(this._container);
		this._map = undefined;
	}

	toggleFullscreen() {
		if (!this._map) return;
		const mapContainer = this._map.getContainer();
		if (this._fullscreen) {
			this._exitFullscreen(mapContainer);
		} else {
			this._enterFullscreen(mapContainer);
		}
	}

	private _enterFullscreen(element: HTMLElement) {
		const req =
			element.requestFullscreen ||
			(element as any).webkitRequestFullscreen ||
			(element as any).mozRequestFullScreen ||
			(element as any).msRequestFullscreen;
		if (req) {
			req.call(element);
		} else {
			this._fallbackFullscreen(element);
		}
		this._fullscreen = true;
		this._updateButtonIcon();
	}

	private _exitFullscreen(element: HTMLElement) {
		const exit =
			document.exitFullscreen ||
			(document as any).webkitExitFullscreen ||
			(document as any).mozCancelFullScreen ||
			(document as any).msExitFullscreen;
		if (exit) {
			exit.call(document);
		} else {
			this._fallbackExitFullscreen(element);
		}
		this._fullscreen = false;
		this._updateButtonIcon();
	}

	private _fallbackFullscreen(element: HTMLElement) {
		this._originalStyles = {
			position: element.style.position,
			top: element.style.top,
			left: element.style.left,
			width: element.style.width,
			height: element.style.height,
			zIndex: element.style.zIndex
		};
		element.style.position = 'fixed';
		element.style.top = '0';
		element.style.left = '0';
		element.style.width = '100%';
		element.style.height = '100%';
		element.style.zIndex = '9999';
		setTimeout(() => this._map?.resize(), 0);
	}

	private _fallbackExitFullscreen(element: HTMLElement) {
		for (const [prop, value] of Object.entries(this._originalStyles)) {
			(element.style as any)[prop] = value;
		}
		setTimeout(() => this._map?.resize(), 0);
	}

	private _updateButtonIcon() {
		this._icon.classList.toggle('fullscreen-icon', !this._fullscreen);
		this._icon.classList.toggle('exit-fullscreen-icon', this._fullscreen);
	}
}
