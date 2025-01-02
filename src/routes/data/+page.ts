import { censusService } from '$lib/services/census';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const data = await censusService.search({ q: 'maryland', size: 50 });
    return { censusData: data };
};