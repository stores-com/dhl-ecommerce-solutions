const assert = require('node:assert');
const crypto = require('node:crypto');
const test = require('node:test');

const cache = require('memory-cache');

const DhlEcommerceSolutions = require('../index');

test('DhlEcommerceSolutions', { concurrency: true, timeout: 4000 }, (t) => {
    t.test('applyDimensionalWeight', { concurrency: true, timeout: 1000 }, (t) => {
        const createRequest = () => ({
            consigneeAddress: {
                address1: '114 Whitney Ave',
                city: 'New Haven',
                country: 'US',
                name: 'John Doe',
                postalCode: '06510',
                state: 'CT'
            },
            distributionCenter: 'USDFW1',
            packageDetail: {
                dimension: {
                    height: 14,
                    length: 14,
                    width: 14,
                    unitOfMeasure: 'IN'
                },
                packageDescription: 'ORDER NO 20483739DFDR',
                packageId: 'GM60511234500000001',
                weight: {
                    unitOfMeasure: 'LB',
                    value: 5
                }
            },
            pickup: '5351244',
            rate: {
                calculate: true,
                currency: 'USD'
            },
            returnAddress: {
                address1: '1950 Parker Road',
                address2: 'Receiving Door 32',
                city: 'Carrollton',
                companyName: 'Mercatalyst',
                country: 'US',
                postalCode: '75010',
                state: 'TX'
            }
        });

        t.test('should not set request weight equal to dimensional weight', (t) => {
            t.test('when request does not contain a weight unit of measure', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                delete request.packageDetail.weight.unitOfMeasure;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual(undefined, request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request unitOfMeasure is not LB, OZ, KG or G', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.unitOfMeasure = 'T';

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('T', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request does not contain a weight value', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                delete request.packageDetail.weight.value;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(undefined, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request weight is less than 1lb', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.value = .5;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(.5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request does not contain a height', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                delete request.packageDetail.dimension.height;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(undefined, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request does not contain a dimension unit of measure', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                delete request.packageDetail.dimension.unitOfMeasure;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual(undefined, request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request length + girth is less than 50 inches', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.dimension.height = 5;
                request.packageDetail.dimension.length = 5;
                request.packageDetail.dimension.width = 5;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(5, request.packageDetail.dimension.height);
                assert.strictEqual(5, request.packageDetail.dimension.length);
                assert.strictEqual(5, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request volume (in) is less than 1 cubic foot', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.dimension.height = 1;
                request.packageDetail.dimension.length = 1;
                request.packageDetail.dimension.width = 25;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(1, request.packageDetail.dimension.height);
                assert.strictEqual(1, request.packageDetail.dimension.length);
                assert.strictEqual(25, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request volume (cm) is less than 1 cubic foot', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.dimension.height = 3;
                request.packageDetail.dimension.length = 3;
                request.packageDetail.dimension.width = 64;
                request.packageDetail.dimension.unitOfMeasure = 'CM';

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(3, request.packageDetail.dimension.height);
                assert.strictEqual(3, request.packageDetail.dimension.length);
                assert.strictEqual(64, request.packageDetail.dimension.width);
                assert.strictEqual('CM', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(5, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when weight is larger than dimensional weight', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.value = 50;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(50, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when weight is larger than dimensional weight (kg)', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.value = 50;
                request.packageDetail.weight.unitOfMeasure = 'KG';

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(110.25, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });
        });

        t.test('should set request weight equal to dimensional weight', (t) => {
            t.test('when request unit of measure is inches', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(16.53, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request unit of measure is cm', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.dimension.height = 40;
                request.packageDetail.dimension.length = 40;
                request.packageDetail.dimension.width = 40;
                request.packageDetail.dimension.unitOfMeasure = 'CM';

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(40, request.packageDetail.dimension.height);
                assert.strictEqual(40, request.packageDetail.dimension.length);
                assert.strictEqual(40, request.packageDetail.dimension.width);
                assert.strictEqual('CM', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(23.53, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request weight is in LB', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.unitOfMeasure = 'LB';
                request.packageDetail.weight.value = 12;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(16.53, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request weight is in OZ', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.unitOfMeasure = 'OZ';
                request.packageDetail.weight.value = 100;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(16.53, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request weight is in KG', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.unitOfMeasure = 'KG';
                request.packageDetail.weight.value = 10;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(22.05, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('when request weight is in G', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                request.packageDetail.weight.unitOfMeasure = 'G';
                request.packageDetail.weight.value = 2500;

                dhlEcommerceSolutions.applyDimensionalWeight(request);

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(16.53, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });

            t.test('should allow dimensional divisor to be changed', () => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({});
                const request = createRequest();

                dhlEcommerceSolutions.applyDimensionalWeight(request, '200');

                assert.strictEqual('GM60511234500000001', request.packageDetail.packageId);
                assert.strictEqual(14, request.packageDetail.dimension.height);
                assert.strictEqual(14, request.packageDetail.dimension.length);
                assert.strictEqual(14, request.packageDetail.dimension.width);
                assert.strictEqual('IN', request.packageDetail.dimension.unitOfMeasure);
                assert.strictEqual(13.72, request.packageDetail.weight.value);
                assert.strictEqual('LB', request.packageDetail.weight.unitOfMeasure);
            });
        });
    });

    t.test('createLabel', { concurrency: true, timeout: 4000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.createLabel({}, (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions.createLabel({}, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/shipping/v4/label?format=ZPL"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 4000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.createLabel({}, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error when no body is specified', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.createLabel({}, (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.status, 400);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a valid response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                const _request = {
                    consigneeAddress: {
                        address1: '114 Whitney Ave',
                        city: 'New Haven',
                        country: 'US',
                        name: 'John Doe',
                        postalCode: '06510',
                        state: 'CT'
                    },
                    distributionCenter: 'USDFW1',
                    orderedProductId: 'GND',
                    packageDetail: {
                        packageDescription: 'ORDER NO 20483739DFDR',
                        packageId: crypto.randomUUID().substring(0, 30),
                        weight: {
                            unitOfMeasure: 'LB',
                            value: 3
                        }
                    },
                    pickup: '5351244',
                    returnAddress: {
                        address1: '1950 Parker Road',
                        address2: 'Receiving Door 32',
                        city: 'Carrollton',
                        companyName: 'Mercatalyst',
                        country: 'US',
                        postalCode: '75010',
                        state: 'TX'
                    }
                };

                dhlEcommerceSolutions.createLabel(_request, (err, response) => {
                    try {
                        assert.ifError(err);
                        assert(response);
                        assert(response.labels.every(label => label.labelData));
                        assert(response.labels.every(label => label.format === 'ZPL'));
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a valid response for PNG format', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                const _request = {
                    consigneeAddress: {
                        address1: '114 Whitney Ave',
                        city: 'New Haven',
                        country: 'US',
                        name: 'John Doe',
                        postalCode: '06510',
                        state: 'CT'
                    },
                    distributionCenter: 'USDFW1',
                    orderedProductId: 'GND',
                    packageDetail: {
                        packageDescription: 'ORDER NO 20483739DFDR',
                        packageId: crypto.randomUUID().substring(0, 30),
                        weight: {
                            unitOfMeasure: 'LB',
                            value: 3
                        }
                    },
                    pickup: '5351244',
                    returnAddress: {
                        address1: '1950 Parker Road',
                        address2: 'Receiving Door 32',
                        city: 'Carrollton',
                        companyName: 'Mercatalyst',
                        country: 'US',
                        postalCode: '75010',
                        state: 'TX'
                    }
                };

                dhlEcommerceSolutions.createLabel(_request, { format: 'PNG' }, (err, response) => {
                    try {
                        assert.ifError(err);
                        assert(response);
                        assert(response.labels.every(label => label.labelData));
                        assert(response.labels.every(label => label.format === 'PNG'));
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('createManifest', { concurrency: true, timeout: 4000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.createManifest({ manifests: [], pickup: '1234567' }, (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions.createManifest({ manifests: [], pickup: '5351244' }, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/shipping/v4/manifest"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 4000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        // Update cache
                        cache.put('https://httpbin.org/status/500#/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.createManifest({ manifests: [], pickup: '5351244' }, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.createManifest({ manifests: [], pickup: '5351244' }, (err, response) => {
                    try {
                        assert.ifError(err);

                        assert.ok(response.timestamp);
                        assert.notStrictEqual(NaN, Date.parse(response.timestamp));
                        assert.ok(response.requestId);
                        assert.ok(response.link);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('downloadManifest', { concurrency: true, timeout: 4000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.downloadManifest('5351244', 'b56fe9d0-1111-2222-a11f-f8f8635f985a', (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        dhlEcommerceSolutions.downloadManifest('5351244', 'b56fe9d0-1111-2222-a11f-f8f8635f985a', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/shipping/v4/manifest/5351244/b56fe9d0-1111-2222-a11f-f8f8635f985a"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 4000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        // Update cache
                        cache.put('https://httpbin.org/status/500#/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.downloadManifest('5351244', 'b56fe9d0-1111-2222-a11f-f8f8635f985a', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                const pickup = '5351244';

                dhlEcommerceSolutions.createManifest({ manifests: [], pickup }, (err, response) => {
                    try {
                        assert.ifError(err);
                        assert.ok(response.requestId);

                        const requestId = response.requestId;

                        dhlEcommerceSolutions.downloadManifest(pickup, requestId, (err, response) => {
                            try {
                                assert.ifError(err);
                                assert.ifError(response.errorCode);
                                assert.ifError(response.errorDescription);

                                assert.ok(response.manifestSummary);
                                assert(Number.isInteger(response.manifestSummary.total));
                                assert.strictEqual(pickup, response.pickup);
                                assert.strictEqual(requestId, response.requestId);
                                assert.strictEqual(['CREATED', 'IN_PROGRESS', 'COMPLETED'].includes(response.status), true);
                                assert.notStrictEqual(NaN, Date.parse(response.timestamp));
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('findProducts', { concurrency: true, timeout: 3000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.findProducts({}, (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions.findProducts({}, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/shipping/v4/products"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.findProducts({}, (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error when no body is specified', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.findProducts({}, (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.status, 400);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a valid response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                const _request = {
                    consigneeAddress: {
                        address1: '114 Whitney Ave',
                        city: 'New Haven',
                        country: 'US',
                        name: 'John Doe',
                        postalCode: '06510',
                        state: 'CT'
                    },
                    distributionCenter: 'USDFW1',
                    packageDetail: {
                        packageDescription: 'ORDER NO 20483739DFDR',
                        packageId: 'GM60511234500000001',
                        weight: {
                            unitOfMeasure: 'LB',
                            value: 3
                        }
                    },
                    pickup: '5351244',
                    rate: {
                        calculate: true,
                        currency: 'USD'
                    },
                    returnAddress: {
                        address1: '1950 Parker Road',
                        address2: 'Receiving Door 32',
                        city: 'Carrollton',
                        companyName: 'Mercatalyst',
                        country: 'US',
                        postalCode: '75010',
                        state: 'TX'
                    }
                };

                dhlEcommerceSolutions.findProducts(_request, (err, response) => {
                    try {
                        assert.ifError(err);
                        assert(Array.isArray(response.products));
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('getAccessToken', { concurrency: true, timeout: 3000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(accessToken, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    environment_url: 'https://httpbin.org/status/500#'
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Internal Server Error');
                        assert.strictEqual(err.status, 500);
                        assert.strictEqual(accessToken, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a valid access token', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        assert(accessToken);
                        assert(accessToken.access_token);
                        assert(accessToken.client_id);
                        assert(accessToken.expires_in);
                        assert.strictEqual(accessToken.token_type, 'Bearer');
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return the same access token on subsequent calls', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken1) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions.getAccessToken((err, accessToken2) => {
                            try {
                                assert.ifError(err);
                                assert.deepStrictEqual(accessToken2, accessToken1);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('getTrackingByPackageId', { concurrency: true, timeout: 4000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.getTrackingByPackageId('V4-TEST-1586965592482', (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions.getTrackingByPackageId('V4-TEST-1586965592482', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/tracking/v4/package?packageId=V4-TEST-1586965592482"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 4000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        // Update cache
                        cache.put('https://httpbin.org/status/500#/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.getTrackingByPackageId('V4-TEST-1586965592482', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getTrackingByPackageId('V4-TEST-1586965592482', (err, response) => {
                    try {
                        assert.ifError(err);
                        assert.strictEqual(response.packages.length, 0);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });

    t.test('getTrackingByTrackingId', { concurrency: true, timeout: 4000 }, (t) => {
        t.test('should return an error for invalid environment_url', { timeout: 1000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    environment_url: 'invalid'
                });

                dhlEcommerceSolutions.getTrackingByTrackingId('9374869903500011991299', (err, response) => {
                    try {
                        assert(err);
                        assert.strictEqual(err.message, 'Invalid URI "invalid/auth/v4/accesstoken"');
                        assert.strictEqual(err.status, undefined);
                        assert.strictEqual(response, undefined);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for invalid environment_url after getAccessToken', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'invalid'
                        });

                        // Update cache
                        cache.put('invalid/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions.getTrackingByTrackingId('9374869903500011991299', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Invalid URI "invalid/tracking/v4/package?trackingId=9374869903500011991299"');
                                assert.strictEqual(err.status, undefined);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return an error for non 200 status code', { timeout: 4000 }, () => {
            return new Promise((resolve, reject) => {
                let dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getAccessToken((err, accessToken) => {
                    try {
                        assert.ifError(err);

                        // Update cache
                        cache.put('https://httpbin.org/status/500#/auth/v4/accesstoken?client_id=undefined', accessToken, accessToken.expires_in * 1000 / 2);

                        dhlEcommerceSolutions = new DhlEcommerceSolutions({
                            environment_url: 'https://httpbin.org/status/500#'
                        });

                        dhlEcommerceSolutions.getTrackingByTrackingId('9374869903500011991299', (err, response) => {
                            try {
                                assert(err);
                                assert.strictEqual(err.message, 'Internal Server Error');
                                assert.strictEqual(err.status, 500);
                                assert.strictEqual(response, undefined);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });

        t.test('should return a response', { timeout: 3000 }, () => {
            return new Promise((resolve, reject) => {
                const dhlEcommerceSolutions = new DhlEcommerceSolutions({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                });

                dhlEcommerceSolutions.getTrackingByTrackingId('9374869903500011991299', (err, response) => {
                    try {
                        assert.ifError(err);
                        assert.strictEqual(response.packages.length, 0);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    });
});