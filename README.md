# Strapi plugin Masterclass

Turn your Strapi application into a full-featured Learning Management System and start selling courses.

## Features

- Upload lectures to [Mux](https://mux.com)
- Create categories and nested categories
- Integrate with [Payments plugin](https://npmjs.com/package/strapi-plugin-payments)
- Students are able to save their progress in each course, and resume at any time
- And much more

## Requirements

- Strapi v4.x.x
- Mux account
  - Signing Key ID
  - Base64-encoded Private Key
  - Access token ID
  - Secret Key

## Installation

In the root of your strapi application, run the following command:

```bash
npm i strapi-plugin-masterclass
```

## Configuring private keys

Once installed, go to `settings`, then `Masterclass Plugin` and fill in the fields under `Uploads` tab to set the credentials to upload videos to [Mux](https://mux.com).

![Video uploads config](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/video-uploads.png)

Creating orders and accepting payments are done through the [Payments plugin](https://npmjs.com/package/strapi-plugin-payments). Therefore, in order to enable the API endpoints to sell courses, it is required to install the [Payments plugin](https://npmjs.com/package/strapi-plugin-payments) as well.

## Setting up permissions

In order for the plugin to serve content, manage users and create and confirm orders, you must enable some endpoints in the `Users & Permissions Plugin`for the `Masterclass` plugin.

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

This last one is for `Mux` to notify through webhooks when a video has been successfully uploaded and is ready. This will require that you configure a webhook in the dashboard of `Mux` account pointing to `https://your-strapi-app.com/api/masterclass/upload-status`

![Public permissions](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/public.png)

## Usage

Creating courses and uploading lectures is done through the Strapi Admin Dashboard.

Courses are organised in categoires, which can be nested.

The API endpoints provide a way to list categories and information on their courses, as well as authentication keys to play videos for students and also marking the lectures as seen to register their progress as they watch the videos.

### Creating lectures

Go to the Masterclass plugin page, and there you will find two tabs: `Courses` and `Lectures`. Before creating a course, it is required to create some lectures.

### Creating courses

Go to the Masterclass plugin page and there you will find a `Create Course` button. When you click on this button, a modal containing a form will open up. Fill in the fields to set the `Course Title`, `Description`

## API



## Sample client app

For an example of a project using the APIs available in this plugin, check out this [Next JS project](https://github.com/luisguve/tutoru-frontend-ts).

Demo: https://tutoruniversitario.netlify.app

![Demo](https://raw.githubusercontent.com/luisguve/strapi-plugin-masterclass/main/demo.png)

## Bug reports

If you find a bug or need support for using this plugin, open an issue at https://github.com/luisguve/strapi-plugin-masterclass
