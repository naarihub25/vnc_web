# VNUC Web

Next.js frontend for VNUC retail and admin screens.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Admin login API

The `/admin` form posts `{ email, password }` to
`http://3.111.131.51/api/admin/login`. All API requests use
`NEXT_PUBLIC_API_BASE_URL` from `.env`. Set this to the backend origin without
`/api`, since request paths already include `/api`. To use a different backend, update it
and restart the frontend (rebuild for
production):

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://3.111.131.51
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
# Optional fallback; the Razorpay order API normally returns data.razorpay.keyId.
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_public_key
```

`NEXT_PUBLIC_SITE_URL` is used for absolute canonical URLs, Open Graph URLs and
social sharing images. Set it to the public storefront origin without a trailing
slash before creating a production build.

## Category image uploads

The admin category form posts multipart `FormData` with the image in the `file`
field to `/api/categories/image-upload-url` on `NEXT_PUBLIC_API_BASE_URL`,
including session credentials. The browser sets the multipart content type and
boundary automatically. The backend uploads the file to storage and returns
`{ imageUrl }`, either directly or inside `data` in the backend's
`{ flag, data, error }` envelope. The frontend then saves `imageUrl` with the
category. Upload failures display the backend's `error` and prevent category
submission.

AWS credentials and storage upload configuration belong on the backend.

## Razorpay checkout

Online payment uses Razorpay Custom Checkout from the Razorpay-hosted
`v1/razorpay.js` library. The page discovers the payment methods enabled on the
account and renders VnU-owned forms for UPI Collect, cards and netbanking. It
first creates an order with `POST /api/payments/razorpay/orders` and sends
`{ userId, items }`. A successful request must return HTTP `201`, `flag: true`,
the internal order in `data.order`, and `{ keyId, orderId, amount, currency }`
in `data.razorpay`. The returned amount is used directly as the currency subunit
amount sent to Razorpay.

After `createPayment` succeeds, the frontend sends `razorpay_payment_id`,
`razorpay_order_id`, and `razorpay_signature` to
`POST /api/payments/razorpay/verify`. The verification response uses the
existing `{ flag, data, error }` envelope and returns the finalized order with
`data.payment.status: "paid"`. Keep the Razorpay key secret, order creation,
signature verification and payment capture entirely on the backend; only the
public key ID belongs in `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

The frontend runs locally on port 3000 and connects to the configured backend.
The backend must allow the frontend origin through CORS, including credentials.
Login requests include cookies if the backend establishes a cookie session.

A successful `{ flag: true, data: { ... } }` response stores the returned active
admin profile and opens `/admin/dashboard`. “Remember me” selects local storage;
otherwise the profile uses session storage. Failures display the API's `error`.
No token is fabricated: the supplied API contract has no token. Profile storage
does not provide authorization; protected APIs must enforce the backend session.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

This project does not include backend services, API routes, MongoDB models, seed
scripts, or server-side data persistence.
