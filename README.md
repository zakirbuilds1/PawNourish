# PawNourish Natural Pet Food

Static online store for a natural pet food brand. Plain HTML, CSS and JavaScript, no build step.

```
index.html      page markup
css/style.css   styles, design tokens, and the CSS-drawn product bags and shipping box
js/main.js      product catalog, filters + search, wishlist, cart, promo code, subscriptions, checkout
images/         WebP photography (see CREDITS.md)
vercel.json     browser caching rules for images, CSS and JS on Vercel
```

## Products and prices

All products live in one place: the `PRODUCTS` list at the top of `js/main.js`. Each entry sets the name, pet type, price (in US cents, so `2499` = $24.99), rating, badge, bag colors and the photo shown next to the bag. The product cards, filters, search, cart and subscription builder all read from that list, so edit it there only.

Store settings sit just below it: free shipping from $50 (`FREE_SHIP_AT`), $5.99 shipping (`SHIPPING`), 15% subscription discount (`SUB_DISCOUNT`) and the `WELCOME20` promo code (`PROMO`).

## Before going live

- The phone number (800) 555-0142 is a placeholder from the range reserved for fictional use. Replace it and the email address with real ones.
- Ratings, review counts and customer reviews are sample content. Replace them with real reviews.
- The cart, checkout, subscriptions and newsletter work in the browser only: no order is sent and no payment is taken. Connect checkout to your store platform or payment provider (for example Shopify, Stripe or Snipcart) and the newsletter to your email tool before launch.
- Add Terms, Privacy and Shipping policy pages if you sell online.

## Deploy

Upload the contents of this folder to a GitHub repository, then import that repository on vercel.com/new (Framework Preset: Other, no build command).
