# storefront-whatsapp-contact

npm package that adds a floating WhatsApp button (FAB) and contact popup to **AEM Edge Delivery Services + Adobe Commerce** projects (e.g. those based on [aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce)). Installation automatically copies blocks, scripts, and icons into your project; you only need to configure the GraphQL endpoint.

## Requirements

- EDS project with blocks structure and `scripts/initializers` (AEM Boilerplate Commerce or similar).
- `@dropins/tools` dependency (already present in the boilerplate).
- A GraphQL backend that exposes the WhatsApp configuration (phone, message, etc.) as described below.

## Installation

From your project root:

```bash
npm install improntus/saas-app-storefront-whatsapp-contact
```

The package’s `postinstall` script will:

- Copy `blocks/whatsapp-contact/` (JS + CSS) into your `blocks/` folder.
- Copy `scripts/whatsapp-config.js` and `scripts/initializers/whatsapp.js` into your project.
- Copy the `whatsapp.svg` and `whatsapp-contact.svg` icons into your `icons/` folder.
- Add the WhatsApp initialization call to `scripts/initializers/index.js` if it is not already there.

No manual file copying is required. After installing, configure the **`whatsapp.graphql-endpoint`** parameter (see below).

## Configuration: `whatsapp.graphql-endpoint`

The app gets the button configuration (phone, message, position, etc.) from a GraphQL endpoint. That endpoint is specified in the site configuration under the key **`whatsapp.graphql-endpoint`**.

### Where to configure it

In your EDS project, configuration is typically in:

- **`config.json`** (production / default environment)
- **`demo-config.json`** (demo environment), if you use it

The expected structure is under the section your site uses for config (e.g. `public.default` or similar). Example:

```json
{
  "public": {
    "default": {
      "whatsapp": {
        "graphql-endpoint": "https://YOUR_ENDPOINT/graphql"
      }
    }
  }
}
```

Replace `https://YOUR_ENDPOINT/graphql` with the actual URL of your GraphQL API that serves the WhatsApp configuration.

### How the app reads the value

The `scripts/whatsapp-config.js` module uses the EDS/dropins config API:

```js
getConfigValue('whatsapp.graphql-endpoint')
```

That value is typically resolved from `config.json` (or equivalent) based on the environment. No code changes are needed; just define the key in the appropriate JSON.

### What your backend (GraphQL) must expose

The endpoint must respond to a **POST** request with a GraphQL query like this:

```graphql
query GetWhatsAppConfig {
  storeConfig {
    whatsapp_phone
    whatsapp_message
    whatsapp_enabled
    whatsapp_icon_position
    whatsapp_use_custom_icon
    whatsapp_custom_icon_url
  }
}
```

Expected fields on `storeConfig`:

| Field                      | Type    | Description                                                                 |
|----------------------------|---------|-----------------------------------------------------------------------------|
| `whatsapp_phone`           | String  | Phone number with country code (e.g. `5491112345678`).                      |
| `whatsapp_message`        | String  | Default message sent when opening the chat (optional).                      |
| `whatsapp_enabled`         | Boolean | If `false`, the button is not shown.                                        |
| `whatsapp_icon_position`   | String  | One of: `whatsapp-bottom-right`, `whatsapp-bottom-left`, `whatsapp-top-right`, `whatsapp-top-left`. |
| `whatsapp_use_custom_icon` | Boolean | Whether to use a custom icon.                                                |
| `whatsapp_custom_icon_url` | String  | URL of the custom icon (if applicable).                                     |

Example valid response:

```json
{
  "data": {
    "storeConfig": {
      "whatsapp_phone": "+54 9 11 1234-5678",
      "whatsapp_message": "Hi, I have a question.",
      "whatsapp_enabled": true,
      "whatsapp_icon_position": "whatsapp-bottom-right",
      "whatsapp_use_custom_icon": false,
      "whatsapp_custom_icon_url": ""
    }
  }
}
```

The frontend normalizes the phone number (removes spaces, dashes, and the `+`) and builds the link `https://wa.me/<number>?text=<message>`.

### If you use Adobe I/O Runtime

You can deploy an action that serves this query. The URL you set in `whatsapp.graphql-endpoint` would be the public URL of that action (e.g. `https://XXXX-whatsappcontact.adobeioruntime.net/api/v1/web/whatsappcontact/graphql`). Just ensure the response matches the schema above.

### Fallback when there is no endpoint

If the endpoint is not configured or fails, the **block** `whatsapp-contact` can use data from the block itself on the page:

- `data-phone` and `data-message` attributes on the block container.
- Or the block’s text content as the phone number.

The **initializer** (FAB injected on all pages) depends on GraphQL; without a valid endpoint it will not show the button unless you have another configuration mechanism.

## Usage on the site

### Option 1: Block on specific pages

Include the `whatsapp-contact` block where you want it (e.g. in a header or footer fragment). The block shows the FAB and popup; clicking “Open WhatsApp” opens `wa.me` with the configured phone and message.

### Option 2: Button on all pages (initializer)

The package already registers the initializer in `scripts/initializers/index.js`. That initializer injects a FAB on all pages (except routes like `/checkout` and `/cart`). That FAB opens the WhatsApp chat directly (no popup). If you also have the block in a section, you can use both behaviors.

### Where to place the block for “all pages”

To show the popup on all pages, place the `whatsapp-contact` block in a global fragment (e.g. footer or header) that is loaded on all templates.

## Files installed by the package

| Source (in package)                    | Destination (in your project)           |
|----------------------------------------|-----------------------------------------|
| `assets/blocks/whatsapp-contact/*`     | `blocks/whatsapp-contact/`               |
| `assets/scripts/whatsapp-config.js`     | `scripts/whatsapp-config.js`             |
| `assets/scripts/initializers/whatsapp.js` | `scripts/initializers/whatsapp.js`   |
| `assets/icons/whatsapp.svg`            | `icons/whatsapp.svg`                    |
| `assets/icons/whatsapp-contact.svg`    | `icons/whatsapp-contact.svg`            |

In addition, the line that imports and initializes WhatsApp is added to `scripts/initializers/index.js` if it did not already exist.

## Publishing to npm

To version this package in a repository and publish it to npm:

1. Copy the `storefront-whatsapp-contact` folder to a new repository.
2. In that repo, fill in the `repository`, `author`, and optionally `publishConfig` fields in `package.json`.
3. Run `npm version patch` (or minor/major) and `npm publish`.

Consumers can then install with:

```bash
npm install storefront-whatsapp-contact
```

or, if you use a scope:

```bash
npm install @your-org/storefront-whatsapp-contact
```

## Author

[![N|Solid](https://improntus.com/wp-content/uploads/2022/05/Logo-Site.png)](https://www.improntus.com)