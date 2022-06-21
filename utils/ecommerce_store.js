'use strict';
const request = require('request');
const PDFDocument = require('pdfkit');
const fs = require('fs');

module.exports = class FakeEcommerceStore {
    constructor() {}
    async _fetchAssistant(endpoint) {
        return new Promise((resolve, reject) => {
            request.get(
                `https://fakestoreapi.com${endpoint ? endpoint : '/'}`,
                (err, res, body) => {
                    try {
                        if (err) {
                            reject({
                                status: 'failed',
                                err,
                            });
                        }

                        resolve({
                            status: 'success',
                            data: JSON.parse(body),
                        });
                    } catch (err) {
                        reject({
                            status: 'failed',
                            error: err,
                        });
                    }
                }
            );
        });
    }

    async getProductById(productId) {
        return await this._fetchAssistant(`/products/${productId}`);
    }
    async getAllCategories() {
        return await this._fetchAssistant('/products/categories?limit=100');
    }
    async getProductsInCategory(categoryId) {
        return await this._fetchAssistant(
            `/products/category/${categoryId}?limit=10`
        );
    }

    generateInvoice({ order_details, file_path }) {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(file_path));
        doc.fontSize(25);
        doc.text(order_details, 100, 100);
        doc.end();
        return;
    }

    generateRandomGeoLocation() {
        let storeLocations = [
            {
                latitude: 44.985613,
                longitude: 20.1568773,
                address: 'New Castle',
            },
            {
                latitude: 36.929749,
                longitude: 98.480195,
                address: 'Glacier Hill',
            },
            {
                latitude: 28.91667,
                longitude: 30.85,
                address: 'Buena Vista',
            },
        ];
        return storeLocations[
            Math.floor(Math.random() * storeLocations.length)
        ];
    }
};