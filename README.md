# SetupKaro — Digital Services

A responsive digital services agency website for SetupKaro, serving businesses in India and internationally.

## What is included

- Agency homepage and service overview
- Website development, video editing, and graphic design service cards
- Concept portfolio with clearly labelled demonstration work
- Four-step project process
- Configurable INR and USD website package display
- India / Global market selector saved in local storage
- Project enquiry modal with validation
- About, FAQ, and contact sections
- Responsive navigation and mobile layouts
- Basic SEO metadata and Open Graph tags
- Optional WhatsApp contact button

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Environment variables

Create a `.env.local` file for local development or configure these in the deployment platform:

- `VITE_CONTACT_EMAIL` — optional destination email. If set, submitting the enquiry opens the visitor's email application with a prepared message.
- `VITE_WHATSAPP_NUMBER` — optional WhatsApp number in international format, digits only (for example, country code + number). Do not include spaces or the plus sign.

The enquiry form is intentionally not presented as a connected backend form. If no contact email is configured, it attempts to copy the enquiry text to the visitor's clipboard and clearly explains that an enquiry inbox has not yet been connected. Configure a proper form endpoint or CRM integration before relying on website enquiries.

## Pricing

The INR and USD website packages are starter prices in `src/App.tsx`. Review and update them before launch to reflect actual deliverables, freelancer costs, taxes, payment fees, revisions and margins.

## Deployment

The existing Cloudflare Worker and D1 configuration are preserved. Static assets are built to `dist` and served through the existing Worker configuration. Existing API routes are not used by the new marketing site.

Before production launch:

1. Configure `VITE_CONTACT_EMAIL` and optionally `VITE_WHATSAPP_NUMBER`.
2. Confirm pricing and package scope.
3. Replace concept portfolio imagery/content with approved work as it becomes available.
4. Add a real enquiry endpoint or CRM integration.
5. Add privacy and terms pages appropriate to the business and jurisdictions served.
6. Run `npm run build` and test the production deployment on desktop and mobile.
