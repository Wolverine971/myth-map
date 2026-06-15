// src/lib/server/radar/rank.ts
import type { RadarConditions, RadarEntity } from '$lib/types/radar';
import { RADAR_RESULT_LIMIT } from './config';

export function rankEntities(
	entities: RadarEntity[],
	conditions: RadarConditions,
	ages: number[]
): RadarEntity[] {
	return entities
		.map((entity) => scoreEntity(entity, conditions, ages))
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
		})
		.slice(0, RADAR_RESULT_LIMIT);
}

function scoreEntity(
	entity: RadarEntity,
	conditions: RadarConditions,
	ages: number[]
): RadarEntity {
	let score = 0;
	const reasons: string[] = [];

	if (entity.source === 'tta') {
		score += 28;
		reasons.push('Tiny Tribe pick');
	} else if (entity.source === 'osm') {
		score += 30;
		reasons.push('public map data');
	} else if (entity.source === 'ticketmaster') {
		score += 32;
		reasons.push('family event feed');
	} else if (entity.source === 'wikipedia') {
		score += 28;
		reasons.push('nearby reference');
	} else if (entity.source === 'wikidata') {
		score += 28;
		reasons.push('notable nearby place');
	} else if (entity.source === 'opensky') {
		score += 12;
		reasons.push('live aircraft');
	}

	switch (entity.layer) {
		case 'library':
			score += 12;
			reasons.push('reliable indoor backup');
			break;
		case 'playground':
			score += 10;
			reasons.push('kid-friendly play');
			break;
		case 'splash_pad':
			score += 12;
			reasons.push('water play');
			break;
		case 'park':
			score += 6;
			break;
		case 'museum':
			score += 14;
			reasons.push('notable indoor stop');
			break;
		case 'attraction':
			score += 12;
			reasons.push('nearby discovery');
			break;
		case 'food_play':
			score += 8;
			reasons.push('snack break');
			break;
		case 'event':
			score += 16;
			reasons.push('time-bound event');
			break;
		case 'aircraft':
			score += 6;
			reasons.push('look up');
			break;
		case 'restroom':
			score -= 10;
			reasons.push('facility stop');
			break;
		default:
			break;
	}

	if (entity.driveMinutes === 15) {
		score += 25;
		reasons.push('inside 15 minutes');
	} else if (entity.driveMinutes === 30) {
		score += 12;
		reasons.push('inside 30 minutes');
	} else if (entity.driveMinutes === 60) {
		score += 4;
		reasons.push('inside 60 minutes');
	} else if (entity.distanceMiles != null) {
		score += Math.max(0, 12 - entity.distanceMiles);
	}

	if (conditions.isWet || conditions.isCold) {
		if (entity.indoor === true) {
			score += 25;
			reasons.push('weatherproof');
		} else if (entity.indoor === false) {
			score -= 20;
			reasons.push('outdoor option demoted by weather');
		} else {
			score -= 5;
		}

		if (entity.layer === 'library') {
			score += 20;
			reasons.push('good rainy-day fallback');
		}
	}

	if (conditions.isHot && entity.layer === 'splash_pad') {
		score += 20;
		reasons.push('hot-day boost');
	}

	if (conditions.daylightRemainingMin > 0 && conditions.daylightRemainingMin < 90) {
		if (entity.indoor === false && entity.driveMinutes === 15) {
			score += 20;
			reasons.push('close before sunset');
		}
		if (entity.driveMinutes === 60) {
			score -= 20;
			reasons.push('too far for remaining daylight');
		}
	}

	if (ages.length && entity.ageTags?.length) {
		score += 8;
		reasons.push('age match');
	}

	return {
		...entity,
		score: Math.round(score),
		reasons: reasons.slice(0, 4)
	};
}
