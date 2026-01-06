# How to Setup Google Drive & Docs Integration

You are 90% there! You are in the Google Cloud Console, which is perfect. Follow these exact steps to get the "Keys" we need.

## Phase 1: Configure the "Consent Screen" (Required first)
1. On the left sidebar of the Google Cloud Console, click **OAuth consent screen** (it's under "Credentials").
2. **User Type**: Choose **External**.
3. Click **Create**.
4. **App Information**:
   - **App Name**: `StoryBoard Plus`
   - **User Support Email**: Select your email.
   - **Developer Contact Info**: Enter your email again.
5. Click **Save and Continue** until you reach the "Test Users" step.
6. **Test Users**: Click **+ Add Users** and enter your own Google email address (the one you use for Drive).
   *   *Why?* Since the app is in "Testing" mode, only users you explicitly list here can use the integration.
7. Click **Save and Continue** to finish.

## Phase 2: Create the OAuth Client ID
1. Click **Credentials** on the left sidebar again.
2. Click **+ Create Credentials** (at the top) -> Select **OAuth client ID**.
3. **Application type**: Select **Web application**.
4. **Name**: `StoryBoard Local`.
5. **Authorized JavaScript origins**:
   - Click **+ Add URI**.
   - Enter: `http://localhost:3000`
6. **Authorized redirect URIs**:
   - Click **+ Add URI**.
   - Enter: `http://localhost:3000`
7. Click **Create**.
8. **COPY THE CLIENT ID**. It will look something like `123456...apps.googleusercontent.com`.
   - *Note: You can ignore the "Client Secret" for this specific setup.*

## Phase 3: Create an API Key
1. Click **Credentials** (sidebar) again.
2. Click **+ Create Credentials** (top) -> Select **API key**.
3. **COPY THE API KEY**. It will start with `AIza...`.

## Phase 4: Plug them into StoryBoard Plus
1. Go to the **Settings** page in StoryBoard Plus (I am building this for you now!).
2. Paste the **Client ID** and **API Key**.
3. Click **Save Connection**.
