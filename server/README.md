# Chat server

## Run locally

The server needs MongoDB and Redis. Copy the following keys into `server/.env` and set your own values; do not commit credentials:

```env
PORT=3000
DATABASE=mongodb://127.0.0.1:27017/chatapp
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace-with-a-long-random-secret
EMAIL=your-sender@gmail.com
PASSWORD=your-gmail-app-password
GOOGLE_API_KEY=your-google-ai-api-key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
API_PUBLIC_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

`EMAIL` and `PASSWORD` are the Gmail sender account and its app password used for verification mail. Registration returns an error if mail delivery is not configured or fails.
`GOOGLE_API_KEY` (or the existing `API_KEY` variable) enables Gemini smart replies. The service uses LangChain inside a LangGraph flow and caches each message's three suggestions in Redis for 24 hours. If no AI key is configured, chat still works and the UI reports that suggestions are unavailable.
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` enable Google sign-in. In Google Cloud Console, create an OAuth 2.0 Web application client, add `http://localhost:5173` under Authorized JavaScript origins, and add `${API_PUBLIC_URL}/user/google/callback` under Authorized redirect URIs. For this local setup the callback is `http://localhost:3000/user/google/callback`. The backend exchanges Google credentials and gives the frontend a short-lived, single-use Redis code; account JWTs are never put in the redirect URL.

Start the API and frontend in separate terminals:

```sh
cd server
npm install
npm start
```

```sh
cd client/my-chat-app
npm install
npm run dev
```

The frontend's local `.env.local` points to `http://localhost:3000`. `CLIENT_URL` accepts a comma-separated list of allowed browser origins.

## API

Authentication routes are under `/user`: `POST /register`, `POST /otp-verify`, `POST /otp-resend`, and `POST /login`. Google sign-in uses `GET /google` and its configured callback; the frontend exchanges the returned one-time code through `POST /google/exchange`. Authenticated requests use `Authorization: Bearer <token>`; `GET /me`, `GET /contacts`, `PATCH /profile`, and `POST /logout` use this header. Profile photo uploads use multipart field `avatar` (JPG, PNG, or WebP, up to 2 MB); uploads are stored in the ignored `server/uploads/avatars` folder.

Authenticated chat routes are under `/chat`: `GET /` lists conversations, `POST /direct` creates or opens a direct chat, `POST /group` creates a group, `GET /:id/messages` loads history, `POST /:id/messages` sends a text or attachment, `POST /:id/suggestions` creates three AI reply suggestions for the latest incoming message, `DELETE /:id/messages` clears history for the current user, and `PATCH /:id/preferences` updates mute/block settings.

Socket.IO uses the same JWT through `auth.token`; clients join only conversations where they are a participant. Attachments are stored with messages and are limited to 1 MB.

Audio and video calls are available in direct conversations between online users. They use WebRTC peer-to-peer media and the authenticated Socket.IO connection for call signaling; both participants must grant microphone/camera access. Group calls are not supported. STUN servers help establish peer connections, but some restrictive networks require a TURN relay to be configured before calls can connect.
