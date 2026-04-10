const detailsCache = new Map();
const translationCache = new Map();
async function fetchPhoto(locationId) {
    const photosUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?language=en&key=${process.env.TRIPADVISOR_KEY}`;

    try {
        const res = await fetch(photosUrl, {
            headers: {
                'X-TripAdvisor-API-Key': process.env.TRIPADVISOR_KEY,
            },
        });

        const data = await res.json();

        const photoUrl = data?.data?.[0]?.images?.large?.url || null;

        if (photoUrl) {
            console.log(`Photo loaded for ${locationId}:`, photoUrl);
        } else {
            console.warn(`No photo found for ${locationId}`, data);
        }

        return photoUrl;
    } catch (err) {
        console.warn(`Failed to fetch photo for ${locationId}:`, err);
        return null;
    }
}


async function translateText(text, targetLang = 'uk') {
    if (!text) return "";

    const cacheKey = `${targetLang}:${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: text,
            target: targetLang,
            format: 'text'
        }),
    });

    const data = await res.json();

    if (!res.ok || !data.data?.translations?.[0]?.translatedText) {
        console.error("Translation failed:", data);
        return text;
    }

    const translated = data.data.translations[0].translatedText;
    translationCache.set(cacheKey, translated);
    return translated;
}

async function getTripadvisorSuggestions(req, res) {
    const { lat, lng, category = 'hotels', radius = 5, limit = 3 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Missing lat/lng parameters' });
    }

    const latLng = `${parseFloat(lat).toFixed(6)},${parseFloat(lng).toFixed(6)}`;
    const searchUrl = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${latLng}&radius=${radius}&category=${category}&language=en&key=${process.env.TRIPADVISOR_KEY}`;

    try {
        const response = await fetch(searchUrl, {
            headers: {
                'X-TripAdvisor-API-Key': process.env.TRIPADVISOR_KEY,
            }
        });

        const text = await response.text();
        if (!response.ok) {
            console.error("TripAdvisor nearby_search error:", text);
            return res.status(response.status).json({ error: text });
        }

        const nearbyData = JSON.parse(text);

        const rawItems = (nearbyData.data || [])
            .filter(item => item?.location_id)
            .sort((a, b) => parseInt(b.num_reviews || 0) - parseInt(a.num_reviews || 0));

        const detailedItems = await Promise.all(
            rawItems.map(async (item) => {
                const locationId = item.location_id;

                if (detailsCache.has(locationId)) {
                    return detailsCache.get(locationId);
                }

                const detailUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&key=${process.env.TRIPADVISOR_KEY}`;
                try {
                    const detailRes = await fetch(detailUrl, {
                        headers: {
                            'X-TripAdvisor-API-Key': process.env.TRIPADVISOR_KEY,
                        },
                    });

                    if (!detailRes.ok) {
                        const detailText = await detailRes.text();
                        console.warn(`Details fetch failed for ${locationId}:`, detailText);
                        return null;
                    }

                    const detailData = await detailRes.json();
                    detailsCache.set(locationId, detailData);
                    return detailData;
                } catch (err) {
                    console.error(`Error fetching details for ${locationId}:`, err);
                    return null;
                }
            })
        );

        const filtered = await Promise.all(
            detailedItems
                .filter(item => item && item.name && item.rating && item.web_url)
                .slice(0, Number(limit))
                .map(async (item) => {
                    const translatedName = await translateText(item.name);
                    const translatedAddress = await translateText(item.address_obj?.address_string);
                    const photoUrl = await fetchPhoto(item.location_id);

                    return {
                        ...item,
                        name: translatedName,
                        address_obj: {
                            ...item.address_obj,
                            address_string: translatedAddress
                        },
                        photo: photoUrl ? {
                            images: {
                                large: {
                                    url: photoUrl
                                }
                            }
                        } : undefined
                    };
                })

        );

        res.json({ data: filtered });

    } catch (error) {
        console.error("Suggestion API failed:", error);
        res.status(500).json({ error: error.toString() });
    }
}

module.exports = { getTripadvisorSuggestions };
