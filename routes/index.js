'use strict';
const router = require('express').Router();
const request = require('request');
// const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const WhatsappCloudAPI = require('./../../whatsappcloudapi/index.js');
const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
});

const RandomGeoLocations = require('../utils/geolocation_MOCK_DATA.json');

class EcommerceStore {
    constructor() {
        this.baseUrl = 'https://fakestoreapi.com';
    }

    async getAllProducts() {}
    async getProductById(productId) {}
    async getAllCategories() {
        return new Promise((resolve, reject) => {
            request.get(
                `${this.baseUrl}/products/categories?limit=3`,
                (err, res, body) => {
                    if (err) {
                        throw reject({
                            status: 'failed',
                            err,
                        });
                    } else {
                        resolve({
                            status: 'success',
                            data: JSON.parse(body),
                        });
                    }
                }
            );
        });
    }
    async getProductsInCategory(categoryId) {
        return new Promise((resolve, reject) => {
            request.get(
                `${this.baseUrl}/products/category/${categoryId}?limit=3`,
                (err, res, body) => {
                    if (err) {
                        throw reject({
                            status: 'failed',
                            err,
                        });
                    } else {
                        let output = {
                            status: 'success',
                            data: JSON.parse(body),
                        };

                        resolve(output);
                    }
                }
            );
        });
    }
}

router.get('/meta_wa_callbackurl', (req, res) => {
    console.log('GET:Someone is pinging me!');

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (
        mode &&
        token &&
        mode === 'subscribe' &&
        process.env.Meta_WA_VerifyToken === token
    ) {
        // Respond with the challenge token from the request
        return res.status(200).send(challenge);
    } else {
        return res.sendStatus(403);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    let Store = new EcommerceStore();

    try {
        let data = Whatsapp.parseMessage(req.body);

        if (data && !data.isNotificationMessage) {
            let from = data.message.from; // extract the phone number from the webhook payload
            let typeOfMsg = data.msgType;
            let message_id = data.message.id;

            if (typeOfMsg === 'textMessage') {
                // let msg_body = data.message.text.body; // extract the message text from the webhook payload`
                let msg_body = JSON.stringify(data);
                let nameOfSender = data.contacts.profile.name;
                // await Whatsapp.sendText({
                //     message: `Hello ${nameOfSender}\nReceived a message. Now here is an automated reply: ${msg_body}`,
                //     recipientNumber: from,
                //     message_id,
                // });

                let listOfButtons = [
                    {
                        title: 'List some products',
                        id: 'see_products',
                    },
                    {
                        title: 'Track my order',
                        id: 'track_order',
                    },
                    {
                        title: 'Speak to a human',
                        id: 'speak_to_human',
                    },
                ];
                await Whatsapp.sendButtons({
                    message: `Hey ${nameOfSender}, \nYou are speaking to a chatbot.\nWhat do you want to do next?`,
                    recipientNumber: from,
                    message_id,
                    listOfButtons,
                });

                // Respond by sending buttons to the user
            } else if (typeOfMsg === 'mediaMessage') {
                await Whatsapp.sendText({
                    message: `Received a media message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'locationMessage') {
                await Whatsapp.sendText({
                    message: `Received a location message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'contactMessage') {
                await Whatsapp.sendText({
                    message: `Received a contact message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'stickerMessage') {
                await Whatsapp.sendText({
                    message: `Received a sticker message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'adMessage') {
                await Whatsapp.sendText({
                    message: `Received an ad message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'quickReplyMessage') {
                await Whatsapp.sendText({
                    message: `Received a quick reply message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'listMessage') {
                // which product is the user interested in?
                // Respond with an image of the product and a button to buy it directly from the chatbot

                await Whatsapp.sendText({
                    message: `Received a list message.`,
                    recipientNumber: from,
                });
            } else if (typeOfMsg === 'replyButtonMessage') {
                let selectedButton = data.message.button_reply;

                switch (selectedButton.id) {
                    case 'see_products':
                        // respond with a list of products
                        let categories = await Store.getAllCategories();
                        // console.log({
                        //     categories,
                        // });
                        console.log('Got categories');
                        if (categories.status !== 'success') {
                            await Whatsapp.sendText({
                                message: `Sorry, I could not get the categories.`,
                                recipientNumber: from,
                                message_id,
                            });
                        }

                        let _listOfSections = async () => {
                            return Promise.all(
                                categories.data.map(async (category) => {
                                    let product =
                                        await Store.getProductsInCategory(
                                            category
                                        );
                                    if (product.status === 'success') {
                                        return {
                                            title: `Top 3 #${category}`,
                                            rows: product.data.map(
                                                (product) => {
                                                    return {
                                                        id: product.id.toString().substring(0, 256),
                                                        title: product.title.substring(0, 24),
                                                        description: product.description.substring(0, 72),
                                                    }
                                                }
                                            ),
                                        };
                                    }
                                })
                            );
                        };
                        let listOfSections = await _listOfSections();

                        //ensure only 10 items in the array
                        listOfSections = listOfSections.slice(0, 3); 
                        await Whatsapp.sendList({
                            recipientNumber: from,
                            headerText: 'Black Friday Top 3 of 3',
                            bodyText:
                                'We have great products lined up for you based on your previous shopping history.\nPlease select one of the products below.',
                            footerText: 'Powered by: Blanqx LLC',
                            listOfSections,
                            _listOfSections: [
                                {
                                    title: 'Top 3 Fashion',
                                    rows: [
                                        {
                                            title: 'Black LVX T-Shirt',
                                            description:
                                                'KES 2999.00\nLVX is a warm cotton t-shirt',
                                            id: 'SKU12_black_lvx_tshirt',
                                        },
                                        {
                                            title: 'Purple hoodie',
                                            description:
                                                'KES 1999.00\nPurple hoodie with a Logrocket logo',
                                            id: 'SKU13_purple_hoodie',
                                        },
                                        {
                                            title: 'Air Jordan 1',
                                            description:
                                                'KES 10999.00\nWe move where others do not.Wanna fly?',
                                            id: 'SKU14_air_jordan_1',
                                        },
                                    ],
                                },
                                {
                                    title: 'Top 3 Gadgets',
                                    rows: [
                                        {
                                            title: 'Apple Watch',
                                            description:
                                                'KES 75999.00\nTime is finite, enjoy every second of it',
                                            id: 'SKU15_apple_watch',
                                        },
                                        {
                                            title: 'Surface Pro',
                                            description: `KES 59999.00\nDon't just surf the web, surf the world`,
                                            id: 'SKU16_surface_pro',
                                        },
                                        {
                                            title: 'Xiaomi Beats Speaker',
                                            description: `KES 45699\nIt is in how your heartbeats, the way Xiaomi Beats.`,
                                            id: 'SKU17_xiaomi_beats_speaker',
                                        },
                                    ],
                                },
                                {
                                    title: 'Top 3 Kitchen',
                                    rows: [
                                        {
                                            title: 'Portable Hand Mixer',
                                            description: `KES7899\nTempt sweetbuds by mixing your favorite food uniformly.`,
                                            id: 'SKU18_portable_hand_mixer',
                                        },
                                        {
                                            title: 'Non-stick waffle-maker',
                                            description: `KES7899\nGreat Waffles are made with the best ingredients.`,
                                            id: 'SKU19_non_stick_waffle_maker',
                                        },
                                        {
                                            title: '6-set Cooking Spoons',
                                            description: `KES7899\nHold thy happiness right.`,
                                            id: 'SKU20_6_set_cooking_spoons',
                                        },
                                    ],
                                },
                                {
                                    title: '1 random pick',
                                    rows: [
                                        {
                                            title: 'Nivea Icy Soap',
                                            description: `KES899\nStay hydrated and refreshed. Nourish your skin.`,
                                            id: 'SKU21_nivea_icy_soap',
                                        },
                                    ],
                                },
                            ],
                        });
                        break;
                    case 'track_order':
                        // respond with a list of georaphical locations of orders

                        let oneLocation =
                            RandomGeoLocations[
                                Math.floor(
                                    Math.random() * RandomGeoLocations.length
                                )
                            ];
                        await Whatsapp.sendText({
                            recipientNumber: from,
                            message: `Your order is on the way. Here is where we are at now:`,
                        });
                        await Whatsapp.sendLocation({
                            recipientNumber: from,
                            latitude: oneLocation.latitude,
                            longitude: oneLocation.longitude,
                            name: 'Mom-N-Pop Shop',
                            address: oneLocation.address,
                        });
                        break;
                    case 'speak_to_human':
                        // respond with a list of human resources
                        await Whatsapp.sendText({
                            recipientNumber: from,
                            message: `Not to brag, but unlike humans, chatbots are super fast⚡, we never sleep, never rest, never take lunch🍽 and can multitask.\n\nAnway don't fret, a hoooooman will 📞contact you soon.\n\nWanna blast☎ his/her phone😈?\nHere are the contact details:`,
                        });

                        await Whatsapp.sendContact({
                            recipientNumber: from,
                        });
                        break;
                    default:
                        await Whatsapp.sendText({
                            recipientNumber: from,
                            message:
                                'Sorry, I did not understand your request.',
                        });

                        break;
                }
            }

            await Whatsapp.markMessageAsRead({
                message_id,
            });

            return res.sendStatus(200);
        } else if (data && data.isNotificationMessage) {
            console.log('got notification');

            return res.sendStatus(200);
        } else {
            console.log('No data');
            return res.sendStatus(500);
        }
    } catch (error) {
        console.error({ error });
        return res.sendStatus(404);
    }
});

router.get('/qr', async (req, res) => {
    // createQRCodeMessage
    let msg = req.query.msg;

    if (msg) {
        let results = await Whatsapp.createQRCodeMessage({
            message: msg,
        });

        return res.status(200).send(results);
    } else {
        return res.status(400).send('No message provided');
    }
});

module.exports = router;