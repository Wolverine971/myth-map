<!-- src/lib/components/icons/location-arrow.svelte -->
<script>
	export let className = '';

	export let height = '1rem';
	export let fill = 'var(--color-paladin-3)';
	export let iconStyle = '';
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 448 512"
	class={className}
	{height}
	{fill}
	style={iconStyle}
	><path
		d="M224 208H129.4l241.4-98.7L272 350.6V256c0-26.5-21.5-48-48-48zm-48 48h48v48V432c0 15.3 10.8 28.4 25.8 31.4s30-5.1 35.8-19.3l144-352c4.9-11.9 2.1-25.6-7-34.7s-22.8-11.9-34.7-7l-352 144c-14.2 5.8-22.2 20.8-19.3 35.8s16.1 25.8 31.4 25.8H176z"
	/></svg
>
