# WhatsAppCommerce Bot

Commerce Chatbox Whatsapp Business.

> Step 1: Configuring our app on the Meta Developer dashboard

    The first step to using any of Meta’s APIs is to create an app on the Meta dashboard, which is free to do.

    While logged in to your Meta developer account, navigate to https://developers.facebook.com/apps
    Click Create app
    In the screen that follows, select the app type Business
    Next, fill in the name of your app and your email address, and then select the page/business that you want to associate with this app
    On this screen, select WhatsApp and click its Set up button.

    On this screen, take note of:

        - The App ID, which is the ID associated with our Meta app. Mine is 1184643492312754
        - The Temporary access token, which expires after 24 hours. Mine starts with EAAQ1bU6LdrIBA…
        - The Test phone number, which we’ll use to send messages to customers. Mine is +1 555 025 3483
        - The Phone number ID. Mine is 113362588047543
        - The WhatsApp Business Account ID. Mine is 102432872486730
    
    Please note that the temporary access token expires after 24 hours, at which time we’ll need to renew it. When you switch your app to live mode, you can apply for a permanent access token, which we don’t need to do as our app is in development mode.

    The phone number ID and WhatsApp business account ID are tied to the test phone number.

    Next, let’s add a phone number to use for receiving messages.

    In development mode, Meta restricts us to five recipient numbers for reasons to do with preventing spam/misuse. In live/production mode, the number represents the phone numbers of our customers.

    Click Select a recipient phone number and add your own WhatsApp number.

    After adding your recipient number, you will see a screen that looks like the one below. If it is your first time adding your phone number to Meta platforms — such as Facebook Pages, Meta Business suite, or the Meta developer dashboard — you will receive an OTP message from Facebook Business that prompts you to verify that you actually own the recipient number.

> Running nodemon app.js and ngrok http 9000 in other terminal.

    Take note of the URL that ngrok assigns to your Express server. In my example, ngrok issued me this URL: https://7b9b-102-219-204-54.ngrok.io. Keep both the Express server and the ngrok terminal running.

    Next, let’s resume our work in the Meta Developer dashboard. Scroll to the part titled Configure Webhooks to receive messages, and click Configure Webhooks. The link will display a page.

    Click the Edit button and a pop-up will show up.

    In the Callback URL field, paste in the URL that ngrok issued to you and append it with the callback route, as in the ./routes/index.js directive. My full URL, in this case, is https://7b9b-102-219-204-54.ngrok.io/meta_wa_callbackurl.

    In the Verify token field, enter the value of the Meta_WA_VerifyToken as it appears in your ./.env.js file. Then click Verify and save.

    If you configured this well, you will see a console.log message in your Express server’s terminal that says: GET: Someone is pinging me!

    Now, let’s make our Express server receive subscription messages from Meta. On the same Meta Developers dashboard screen, click Manage and a pop-up will appear.
    Select Messages and click Test, which is on the same row.

    You should see a console.log message in your Express server’s terminal that says: POST: Someone is pinging me!
    If you saw this, get back to the same pop-up and click Subscribe in the same message row. Afterwards, click Done.

    https://github.com/DaggieBlanqx/whatsapp-ecommerce-bot and https://blog.logrocket.com/build-ecommerce-app-whatsapp-cloud-api-node-js/