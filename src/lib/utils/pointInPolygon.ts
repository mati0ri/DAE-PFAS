export function pointInPolygon(lat: number, lon: number, polygon: { lat: number; lon: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lon, yi = polygon[i].lat;
        const xj = polygon[j].lon, yj = polygon[j].lat;
        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lon < (xj - xi) * (lat - yi) / ((yj - yi) + Number.EPSILON) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
