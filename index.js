const cache = require('memory-cache');
const HttpError = require('@stores.com/http-error');

/**
 * Reads the response body and mirrors the behavior of the request module's `json: true` option:
 * the body is parsed as JSON when possible and left as raw text when it isn't.
 */
async function parseResponse(res) {
    if (res.status !== 200) {
        throw await HttpError.from(res);
    }

    const text = await res.text();

    try {
        return JSON.parse(text);
    } catch {
        // Not JSON, so return the raw text
        return text;
    }
}

function DhlEcommerceSolutions(args) {
    const options = Object.assign({
        environment_url: 'https://api-sandbox.dhlecs.com',
        timeout: 10000
    }, args);

    /**
     * Applies dimensional weight (instead of physical weight) to a rate request if the specified weight and dimensions qualify for dimensional weight.
     */
    this.applyDimensionalWeight = function(rateRequest, divisor = 166) {
        let weight = rateRequest?.packageDetail?.weight?.value;

        // Convert weight to LB
        switch (rateRequest?.packageDetail?.weight?.unitOfMeasure) {
            case 'G':
                weight /= 453.592;
                break;
            case 'KG':
                weight *= 2.205;
                break;
            case 'LB':
                break;
            case 'OZ':
                weight /= 16;
                break;
            default:
                return;
        }

        // Don't use dimensional weight if the physical weight is less than or equal to 1 pound
        if (!weight || weight <= 1) {
            return;
        }

        if (!rateRequest?.packageDetail?.dimension?.height || !rateRequest?.packageDetail?.dimension?.length || !rateRequest?.packageDetail?.dimension?.width || !rateRequest?.packageDetail?.dimension?.unitOfMeasure) {
            return;
        }

        let height = rateRequest.packageDetail.dimension.height;
        let length = rateRequest.packageDetail.dimension.length;
        let width = rateRequest.packageDetail.dimension.width;

        // Convert dimensions to inches
        if (rateRequest.packageDetail.dimension.unitOfMeasure === 'CM') {
            height /= 2.54;
            length /= 2.54;
            width /= 2.54;
        }

        // Calculate girth: https://www.dhl.com/us-en/home/ecommerce-solutions/shipping-services.html
        const girth = (2 * width) + (2 * height);

        // Don't use dimensional weight if the length + girth is less than or equal to 50 inches
        if (length + girth <= 50) {
            return;
        }

        const volume = length * width * height;

        // Don't use dimensional weight if the volume is less than or equal to one cubic foot
        if (volume <= 1728) {
            return;
        }

        // Use dimensional weight (if it's larger than physical weight)
        rateRequest.packageDetail.weight.value = Number(Math.max(weight, (volume / divisor)).toFixed(2));
        rateRequest.packageDetail.weight.unitOfMeasure = 'LB';
    };

    /**
     * The Label endpoint can generate a US Domestic or an International label.
     */
    this.createLabel = function(_request, _options = {}, callback) {
        // Options are optional
        if (typeof _options === 'function') {
            callback = _options;
            _options = {};
        }

        // Default format is ZPL
        if (!_options.format) {
            _options.format = 'ZPL';
        }

        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/shipping/v4/label?format=${_options.format}`, {
                body: JSON.stringify(_request),
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * Manifest specific open packages (recommended): Only packages specified in the request are added to a request id and only those items will be manifested.
     * Manifest all open items: The last 20,000 labels generated for the given pickup location are added to a request id and will be manifested.
     */
    this.createManifest = function(_request, callback) {
        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/shipping/v4/manifest`, {
                body: JSON.stringify(_request),
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * The Dowload Manifest API is used to retrieve and download the manifests that were created using the Create Manifest API.
     * @param {string} pickup DHL eCommerce pickup account number. You will receive this after doing the onboarding with DHL sales
     * @param {string} requestId DHL eCommerce manifest request ID that was provided in the POST manifest response object
     */
    this.downloadManifest = function(pickup, requestId, callback) {
        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/shipping/v4/manifest/${pickup}/${requestId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`
                },
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * DHL eCommerce Americas Product Finder API enables clients to determine which DHL shipping products are suitable for a given shipping request including associated rates and estimated delivery dates.
     */
    this.findProducts = function(_request, callback) {
        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/shipping/v4/products`, {
                body: JSON.stringify(_request),
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * To access any of DHL eCommerce's API resources, client credentials (clientId and clientSecret) are required which must be exchanged for an access token.
     */
    this.getAccessToken = function(callback) {
        const url = `${options.environment_url}/auth/v4/accesstoken`;
        const key = `${url}?client_id=${options.client_id}`;

        const executor = async () => {
            // Try to get the access token from memory cache
            const accessToken = cache.get(key);

            if (accessToken) {
                return accessToken;
            }

            const res = await fetch(url, {
                body: new URLSearchParams({
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    grant_type: 'client_credentials'
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                method: 'POST',
                signal: AbortSignal.timeout(options.timeout)
            });

            const response = await parseResponse(res);

            // Put the access token in memory cache
            cache.put(key, response, response.expires_in * 1000 / 2);

            return response;
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * Track using a single packageId.
     */
    this.getTrackingByPackageId = function(packageId, callback) {
        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/tracking/v4/package?packageId=${packageId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`
                },
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };

    /**
     * Track using a single trackingId.
     */
    this.getTrackingByTrackingId = function(trackingId, callback) {
        const executor = async () => {
            const accessToken = await this.getAccessToken();

            const res = await fetch(`${options.environment_url}/tracking/v4/package?trackingId=${trackingId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`
                },
                signal: AbortSignal.timeout(options.timeout)
            });

            return await parseResponse(res);
        };

        if (callback) {
            executor().then(result => callback(null, result)).catch(callback);
        } else {
            return executor();
        }
    };
}

module.exports = DhlEcommerceSolutions;
