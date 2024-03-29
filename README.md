# Self Destructing Voice Notes

In this app, we're going to build a self destructing voice chat app. The app deletes the message after the recipient has listened to the message and left the chat screen.

### Screenshots

![Login Page](screenshots/login.jpg)
![Chat Page](screenshots/chat.jpg)

### Technologies

This demo app uses the following:

- [CometChat Pro](https://cometchat.com)
- [React.js](https://reactjs.org)
- [Bootstrap](https://getbootstrap.com)

### Running the demo application

In order to run the demo application locally, you'll need to follow the following steps:

1. Create an account with [CometChat Pro](https://cometchat.com)
2. Go to the [CometChat Pro Dashboard](https://app.cometchat.com/#/apps) and create a new app called **self-destruct-voice-app** .
3. You will be redirected to your newly created app, now click on the **Explore** button to view your app details.
4. Go to the **API Keys** tab and you will see an already generated **App ID** and **API Key**
5. Copy the details from the list with **Full Access** as Scope.
6. Clone the repository by running `git clone https://github.com/cometchat-pro-tutorials/self-destructing-voice-notes` in the terminal and open it with a code editor of your choice.
7. `cd` into the newly created folder and run `npm install` to install dependencies.
8. At the root of your project foleder, create a `.env` file and paste the following snippet.

```
REACT_APP_COMETCHAT_API_KEY=YOUR_API_KEY
REACT_APP_COMETCHAT_APP_ID=YOUR_APP_ID
```

9. Run `npm start` and wait for the development server to start.
10. Open the page `http://localhost:3000` on two different browsers to see the app.
11. Use any of the default usernames **SUPERHERO1**, **SUPERHERO2**, **SUPERHERO3** to login and start sending voice messages.

### Useful Links

- [CometChat Pro JavaScript SDK Documentation](https://prodocs.cometchat.com/docs/js-quick-start)
- [CometChat Pro Dashboard](https://app.cometchat.com/#/apps)
- [Bootstrap](https://getbootstrap.com)
