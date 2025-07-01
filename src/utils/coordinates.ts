// src/utils/coordinates.ts
export function metersToMiles(i) {
    return i * 0.000621371192
}
export function milesToMeters(i) {
    return i * 1609.344
}

export interface LatLng {
    latitude: number | string
    longitude: number | string
}

function toRadians(degrees) {
    return (degrees * Math.PI) / 180
}

function toDegrees(radians) {
    return radians * (180 / Math.PI)
}

export const getHeadingAngleBetweenTwoCoordinates = ({
    startCoordinates,
    endCoordinates,
}) => {
    // equations taken from https://stackoverflow.com/a/52079217

    const startLat = toRadians(startCoordinates[0])
    const startLng = toRadians(startCoordinates[1])
    const endLat = toRadians(endCoordinates[0])
    const endLng = toRadians(endCoordinates[1])

    const x = Math.sin(endLng - startLng) * Math.cos(endLat)

    const y =
        Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng)

    const radians = Math.atan2(x, y)

    const degrees = toDegrees(radians)

    return parseFloat(degrees.toFixed(2))
}

export const getCardinalDirection = ({
    startCoordinates,
    endCoordinates,
    fancy = false,
}) => {
    const heading = getHeadingAngleBetweenTwoCoordinates({
        endCoordinates,
        startCoordinates,
    })

    let cardinalDirection = fancy ? '🧭 ' : ''
    switch (Math.round(heading / 45) * 45) {
        case 0:
        case 360:
            cardinalDirection += 'N' + (fancy ? ` ↑` : '')
            break
        case 45:
        case -315:
            cardinalDirection += 'NE' + (fancy ? ` ↗` : '')
            break
        case 90:
        case -270:
            cardinalDirection += 'E' + (fancy ? ` →` : '')
            break
        case 135:
        case -225:
            cardinalDirection += 'SE' + (fancy ? `↘` : '')
            break
        case 180:
        case -180:
            cardinalDirection += 'S' + (fancy ? ` ↓` : '')
            break
        case 225:
        case -135:
            cardinalDirection += 'SW' + (fancy ? ` ↙` : '')
            break
        case 270:
        case -90:
            cardinalDirection += 'W' + (fancy ? ` ←` : '')
            break
        case 315:
        case -45:
            cardinalDirection += 'NW' + (fancy ? ` ↖` : '')
            break
        default:
            return ''
    }

    return cardinalDirection
}

export const calculateMidpoint = (a1: LatLng, a2: LatLng) => {
    const lat1 = parseFloat(a1.latitude as string) * 0.017453292519943295
    const lng1 = parseFloat(a1.longitude as string) * 0.017453292519943295
    const lat2 = parseFloat(a2.latitude as string) * 0.017453292519943295
    const lng2 = parseFloat(a2.longitude as string) * 0.017453292519943295

    const $dlng = lng2 - lng1
    const $Bx = Math.cos(lat2) * Math.cos($dlng)
    const $By = Math.cos(lat2) * Math.sin($dlng)
    const lat3 = Math.atan2(
        Math.sin(lat1) + Math.sin(lat2),
        Math.sqrt((Math.cos(lat1) + $Bx) * (Math.cos(lat1) + $Bx) + $By * $By)
    )
    const lng3 = lng1 + Math.atan2($By, Math.cos(lat1) + $Bx)
    const $pi = Math.PI
    const latitude = (lat3 * 180) / $pi
    const longitude = (lng3 * 180) / $pi

    return {
        latitude,
        longitude,
    }
}

export function distanceBetweenTwoAngles(angle1, angle2) {
    const phi = Math.abs(angle2 - angle1) % 360 // This is either the distance or 360 - distance
    const distance = phi > 180 ? 360 - phi : phi
    return distance
}

export function convertNegativeAngleToPositive(angle) {
    return angle < 0 ? 360 - Math.abs(angle) : angle
}

/**
 * Use the Haversine formula to calculate the straight-line distance between two points on a sphere in meters.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} The distance between two points in meters.
 */
export function distanceBetweenTwoLatLng(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0

    const radlat1 = (Math.PI * lat1) / 180
    const radlat2 = (Math.PI * lat2) / 180
    const theta = lon1 - lon2
    const radtheta = (Math.PI * theta) / 180
    let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
        dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515

    return milesToMeters(dist)
}

/**
 * Returns the estimated driving distance in meters based on a standard detour index. The detour index is derived from a study which compared straight-line distance to driving distance for more than 66,000 hospital locations around the United States. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3835347
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} The estimated driving distance in meters.
 */
export function getDetourDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const linearDistance = distanceBetweenTwoLatLng(lat1, lon1, lat2, lon2)
    const detourIndex = 1.417

    if (linearDistance === 0) {
        return 0
    }

    return linearDistance * detourIndex
}

export function getRoughSpeedEstimateFromTwoLatLng(
    lat1,
    lon1,
    lat2,
    lon2,
    startTime,
    endTime
) {
    const distance = distanceBetweenTwoLatLng(lat1, lon1, lat2, lon2)
    const timeDiff = (startTime - endTime) / 1000 // startTime and endTime should be in ms
    const roughSpeed =
        distance / timeDiff < 0 ? (distance / timeDiff) * -1 : distance / timeDiff

    return roughSpeed
}

/**
 * Returns the estimated duration of travel in seconds for a given distance in kilometers. This estimate assumes an average speed of 30 mph.
 *
 * @param {number} distance The distance in meters.
 */
export function getEstimatedDurationFromDistance(distance) {
    // The value of 72 seconds of travel per kilometer (about 30 mph) is based on calculating the mode of (duration_from_origin / distance_from_origin) for all records in delivery_driver_fulfillment_requests.
    // https://metabase.curri.com/dashboard/1182-historical-travel-time-average

    return (distance / 1000) * 72
}