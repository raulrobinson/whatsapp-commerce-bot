'use strict';

const router = require('express').Router();

const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
});

const EcommerceStore = require('./../utils/ecommerce_store.js');
let Store = new EcommerceStore();
const CustomerSession = new Map();

router.get('/meta_wa_callbackurl', (req, res) => {
    try {
        console.log('GET: Someone is pinging me!');

        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if (
            mode &&
            token &&
            mode === 'subscribe' &&
            process.env.Meta_WA_VerifyToken === token
        ) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    try {
        let data = Whatsapp.parseMessage(req.body);

        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id

            // Start of cart logic
            if (!CustomerSession.get(recipientPhone)) {
                CustomerSession.set(recipientPhone, {
                    cart: [],
                });
            }

            let addToCart = async ({ product_id, recipientPhone }) => {
                let product = await Store.getProductById(product_id);
                if (product.status === 'success') {
                    CustomerSession.get(recipientPhone).cart.push(product.data);
                }
            };

            let listOfItemsInCart = ({ recipientPhone }) => {
                let total = 0;
                let products = CustomerSession.get(recipientPhone).cart;
                total = products.reduce(
                    (acc, product) => acc + product.price,
                    total
                );
                let count = products.length;
                return { total, products, count };
            };

            let clearCart = ({ recipientPhone }) => {
                CustomerSession.get(recipientPhone).cart = [];
            };
            // End of cart logic

            if (typeOfMsg === 'text_message') {
                await Whatsapp.sendSimpleButtons({
                    message: `Hola ${recipientName}, \nEstas en la tienda chat-online.\nque estas necesitando?`,
                    recipientPhone: recipientPhone,
                    listOfButtons: [
                        {
                            title: 'Ver los productos',
                            id: 'see_categories',
                        },
                        {
                            title: 'Con un vendedor',
                            id: 'speak_to_human',
                        },
                    ],
                });
            }

            if (typeOfMsg === 'radio_button_message') {
                let selectionId = incomingMessage.list_reply.id;

                if (selectionId.startsWith('product_')) {
                    let product_id = selectionId.split('_')[1];
                    let product = await Store.getProductById(product_id);
                    const {
                        price,
                        title,
                        description,
                        category,
                        image: imageUrl,
                        rating,
                    } = product.data;

                    let emojiRating = (rvalue) => {
                        rvalue = Math.floor(rvalue || 0); // generate as many star emojis as whole ratings
                        let output = [];
                        for (var i = 0; i < rvalue; i++) output.push('⭐');
                        return output.length ? output.join('') : 'N/A';
                    };

                    let text = `_Title_: *${title.trim()}*\n\n\n`;
                    text += `_Description_: ${description.trim()}\n\n\n`;
                    text += `_Price_: $${price}\n`;
                    text += `_Category_: ${category}\n`;
                    text += `${
                        rating?.count || 0
                    } shoppers liked this product.\n`;
                    text += `_Rated_: ${emojiRating(rating?.rate)}\n`;

                    await Whatsapp.sendImage({
                        recipientPhone,
                        url: imageUrl,
                        caption: text,
                    });

                    await Whatsapp.sendSimpleButtons({
                        message: `Aqui esta el producto, que mas deseas hacer?`,
                        recipientPhone: recipientPhone,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'Add al Carrito 🛒',
                                id: `add_to_cart_${product_id}`,
                            },
                            {
                                title: 'Con un vendedor',
                                id: 'speak_to_human',
                            },
                            {
                                title: 'Ver mas productos',
                                id: 'see_categories',
                            },
                        ],
                    });
                }
            }

            if (typeOfMsg === 'simple_button_message') {
                let button_id = incomingMessage.button_reply.id;

                if (button_id === 'speak_to_human') {
                    // respond with a list of human resources
                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `No es por presumir, pero a diferencia de los humanos, los chatbots son súper rápidos ⚡, Nosotras nunca dormimos, nunca descansamos, nunca almorzamos 🍽 y somos multitareas.\n\nDe todos modos no te preocupes, una hooooombre lo hará 📞en contacto con usted pronto.\n\nquiero explotar ☎ su teléfono 😈?\nAquí están los datos de contacto:`,
                    });

                    await Whatsapp.sendContact({
                        recipientPhone: recipientPhone,
                        contact_profile: {
                            addresses: [
                                {
                                    city: 'Barranquilla',
                                    country: 'Colombia',
                                },
                            ],
                            name: {
                                first_name: 'rasysbox',
                                last_name: 'RSY',
                            },
                            org: {
                                company: 'Tienda RASYSBOX',
                            },
                            phones: [
                                {
                                    phone: '+57 (605) 3251-3483',
                                },
                                {
                                    phone: '+57 712345678',
                                },
                            ],
                        },
                    });
                }

                if (button_id === 'see_categories') {
                    let categories = await Store.getAllCategories();

                    await Whatsapp.sendSimpleButtons({
                        message: `Nosotros tenemos varias categorias.\nEscoge una de ellas.`,
                        recipientPhone: recipientPhone,
                        message_id,
                        listOfButtons: categories.data
                            .slice(0, 3)
                            .map((category) => ({
                                title: category,
                                id: `category_${category}`,
                            })),
                    });
                }

                if (button_id.startsWith('category_')) {
                    let selectedCategory = button_id.split('category_')[1];
                    let listOfProducts = await Store.getProductsInCategory(
                        selectedCategory
                    );

                    let listOfSections = [
                        {
                            title: `🏆 Top 3: ${selectedCategory}`.substring(
                                0,
                                24
                            ),
                            rows: listOfProducts.data
                                .map((product) => {
                                    let id = `product_${product.id}`.substring(
                                        0,
                                        256
                                    );
                                    let title = product.title.substring(0, 21);
                                    let description =
                                        `${product.price}\n${product.description}`.substring(
                                            0,
                                            68
                                        );

                                    return {
                                        id,
                                        title: `${title}...`,
                                        description: `$${description}...`,
                                    };
                                })
                                .slice(0, 10),
                        },
                    ];

                    await Whatsapp.sendRadioButtons({
                        recipientPhone: recipientPhone,
                        headerText: `#BlackFriday Ofertas: ${selectedCategory}`,
                        bodyText: `Nuestro Santa 🎅🏿 ha alineado algunos productos excelentes para usted en función de su historial de compras anterior.\n\nPor favor selecciona uno de los productos abajo:`,
                        footerText: 'Desarrollado por: RASYSBOX LLC',
                        listOfSections,
                    });
                }

                if (button_id.startsWith('add_to_cart_')) {
                    let product_id = button_id.split('add_to_cart_')[1];
                    await addToCart({ recipientPhone, product_id });
                    let numberOfItemsInCart = listOfItemsInCart({
                        recipientPhone,
                    }).count;

                    await Whatsapp.sendSimpleButtons({
                        message: `Su carrito se ha actualizado.\nNumero de productos en el carrito: ${numberOfItemsInCart}.\n\nQué quieres hacer después?`,
                        recipientPhone: recipientPhone,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'Pagar 🛍️',
                                id: `checkout`,
                            },
                            {
                                title: 'Ver mas productos',
                                id: 'see_categories',
                            },
                        ],
                    });
                }

                if (button_id === 'checkout') {
                    let finalBill = listOfItemsInCart({ recipientPhone });
                    let invoiceText = `Lista de productos en tu carrito:\n`;

                    finalBill.products.forEach((item, index) => {
                        let serial = index + 1;
                        invoiceText += `\n#${serial}: ${item.title} @ $${item.price}`;
                    });

                    invoiceText += `\n\nTotal: $${finalBill.total}`;

                    Store.generatePDFInvoice({
                        order_details: invoiceText,
                        file_path: `./factura_${recipientName}.pdf`,
                    });

                    await Whatsapp.sendText({
                        message: invoiceText,
                        recipientPhone: recipientPhone,
                    });

                    await Whatsapp.sendSimpleButtons({
                        recipientPhone: recipientPhone,
                        message: `Gracias por comprar con nosotros, ${recipientName}.\n\nSu orden ha sido recibida & sera procesada prontamente.`,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'Ver mas productos',
                                id: 'see_categories',
                            },
                            {
                                title: 'Mi Factura',
                                id: 'print_invoice',
                            },
                        ],
                    });

                    clearCart({ recipientPhone });
                }

                if (button_id === 'print_invoice') {
                    // Send the PDF invoice
                    await Whatsapp.sendDocument({
                        recipientPhone,
                        caption: `Tienda RASYSBOX factura #${recipientName}`,
                        file_path: `./factura_${recipientName}.pdf`,
                    });

                    // Send the location of our pickup station to the customer, so they can come and pick their order
                    let warehouse = Store.generateRandomGeoLocation();

                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `Su pedido ha sido cumplido. Ven a recogerlo, como pagas, aquí:`,
                    });

                    await Whatsapp.sendLocation({
                        recipientPhone,
                        latitude: warehouse.latitude,
                        longitude: warehouse.longitude,
                        address: warehouse.address,
                        name: 'Tienda RASYSBOX',
                    });
                }
            }

            await Whatsapp.markMessageAsRead({
                message_id,
            });
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
});
module.exports = router;
