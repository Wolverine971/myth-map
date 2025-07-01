// src/utils/locationPhotos.ts
export const allPlaceIcons = {
	'Science Center': '',
	'Port Discovery': '',
	'NASA Goddard Flight Center': 'nasa',
	'National Aquarium': 'aquarium',
	'Maryland Zoo': 'park-with-zoo',
	'Robinson Nature Center': 'nature-preserve',
	'B&O Train Museum': 'train',
	'Baltimore & Ohio Ellicott City Station Museum': 'train',
	'The Fire Museum of MD': '', //'fire-truck',
	'Bland Air Regional Park North Playground': 'playground',
	'Bland Air Regional Park West Playground': 'playground',
	'Bland Air Regional Park South Playground': 'playground',
	'Schooley Mill Playground': 'playground',
	'Swansfield Neighborhood Playground': 'playground',
	'Cedar Lane Park Playground': 'playground',
	'Cedar Lane Park East Playground': 'playground',
	'Hilton Tire Park': 'park-with-trails',
	'Centennial Park': 'park-with-trails',
	'Centennial Park West': 'park-with-trails',
	'Centennial Park North': 'park-with-trails',
	'Rockburn Branch Park': 'park-with-trails',
	'Rockburn Branch Park East': 'park-with-trails',
	'Piney Run Park': 'park-with-trails',
	'Splash Pad of Sykesville': 'splash-pad',
	'Color Burst Park': '', // 'splash-pad',
	'Mayo Beach Park': '', // 'beach',
	Skyzone: 'trampoline-park',
	Cimbzone: 'climbing-gym',
	Playseum: 'art-studio',
	'Doodle Hatch': 'art-studio',
	Storyville: 'art-studio',
	'Play n Learn': '', // 'indoor-playground',
	'Hyper Kidz': '', // 'indoor-playground',
	'Monster Mini Golf': 'mini-golf',
	'My Gym - Columbia': '', // kids-gym
	'Donut shack': 'donut-shop',
	"Carlson's donuts": 'donut-shop',
	"Charlsie's Bakehouse": 'bakery',
	'Guiness Brewery': 'brewery',
	'Manor Hill Brewery': 'brewery',
	'The Ice Shack': 'ice-cream-truck',
	"Mary's Land Farm": 'farm',
	"Clark's Elioak Farm": 'farm',
	'Larriland Farm': 'farm',
	'Howard County Library Central Branch': 'library',
	'Howard County Library East Columbia Branch': 'library',
	'Howard County Library Elkridge Branch': 'library',
	'Howard County Library Glenwood Branch': 'library',
	'Howard County Library Miller Branch & Historical Center': 'library',
	'Howard County Library Savage Branch & STEM Education Center': 'library',
	"Ellicott Mills Children's Museum": '', // 'childrens-museum',
	'Patuxent Research Refuge - South Tract': 'nature-preserve',
	'Patuxent Research Refuge - North Tract': 'nature-preserve',
	'Greenbrier State Park': 'hiking-trail',
	'Lake Elkhorn': 'lake',
	Grounded: '', // 'outdoor-adventure',
	'Village Center': 'community-center',
	'Thomas A. Dixon, Jr. Aircraft Observation Area': 'aircraft-observation'
};

export const getLocationIcon = (name: string) => {
	if (!name) {
		return 'mythmap';
	}
	const cleanedName = name.replace('’', "'");
	const lowerCaseName = name.toLowerCase();

	if (lowerCaseName.includes('playground')) {
		return 'playground';
	} else if (lowerCaseName.includes('park')) {
		return 'park-with-trails';
	} else if (lowerCaseName.includes('library')) {
		return 'library';
	} else if (lowerCaseName.includes('museum')) {
		return 'museum';
	} else if (lowerCaseName.includes('farm')) {
		return 'farm';
	} else if (lowerCaseName.includes('brewery')) {
		return 'brewery';
	} else if (allPlaceIcons[cleanedName]) {
		return allPlaceIcons[cleanedName];
	}

	return 'mythmap';
};
