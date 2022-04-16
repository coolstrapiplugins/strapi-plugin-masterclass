# Strapi plugin Masterclass

Turn your Strapi app into a full featured learning management platform and start selling courses.

## Features

- Upload lectures to [Mux](https://mux.com) and create courses from within the Admin Panel
- Organise courses in categories and nested categories
- Accept payments with PayPal and credit card through Stripe
- Allow students to save their progress in each course, and resume at any time
- And much more

## Requirements

- Strapi v4.x.x
- Mux account
  - Signing Key ID
  - Base64-encoded Private Key
  - Access token ID
  - Secret Key
- Stripe account
  - Secret key
- Paypal merchant app
  - Client ID
  - Client secret

## Installation

In the root of your strapi application, run the following command:

```bash
npm i strapi-plugin-masterclass
```

## Configuring private keys

Once installed, go to `settings`, then `Masterclass Plugin` and fill in the fields under `Uploads` tab for storing the credentials for [Mux](https://mux.com). Optioanlly, you can configure an AWS private bucket for storing files in case that your application also sells digital assets such as PDFs or eBooks.

![Video uploads config](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/video-uploads.png)

In order to accept payments and create orders, you must configure [Stripe](https://stripe.com) and/or [PayPal merchant app](https://developer.paypal.com/developer/applications/), the set the propper configuration under `settings` > `Masterclass Plugin` > `Stripe`/`Paypal`

## Setting up permissions

In order for the plugin to serve content, manage users and orders, you must enable some permissions of `Users & Permissions Plugin`for the `Masterclass` plugin.

For Authenticated users, enable the following:

From `courses`:

- `checkLecture`
- `getClassesCompleted`
- `getCourseDetails`
- `getItemsPurchased`
- `getMyLearning`
- `getPlayAuth`
- `resumeCourse`

From `orders`:

- `confirm`
- `create`
- `find`
- `findOne`

![Authenticated permissions](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/authenticated.png)

For Public users, enable the following:

From `categories`:

- `categoryTree`
- `index`
- `navigation`
- `summary`

From `courses`:

- `find`
- `findOne`
- `findSlugs`
- `getCourseDetails`

From `uploads`:

- `update`

This last one is for `Mux` to notify through webhooks when a video has been successfully uploaded and is ready. This will require that you configure a webhook in `Mux` dashboard pointing to `https://your-strapi-app.com/api/masterclass/upload-status`

![Public permissions](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/public.png)

## Sample client app

For an implementation of a website querying this API, check out this [Next JS project](https://github.com/luisguve/tutoru-frontend-ts).

Demo: https://tutoruniversitario.netlify.app

![Demo](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/demo.png)

## Bug reports

If you find a bug or need support for using this plugin, open an issue at https://github.com/luisguve/strapi-plugin-masterclass

This plugin is a WIP project and this is the effort of a single developer, so feel free to contact me if you find it interesting, have an advise or would like to support in some way: luisguveal@gmail.com. I would like to hear from you!
