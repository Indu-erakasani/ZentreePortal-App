from google_auth_oauthlib.flow import InstalledAppFlow
import json

SCOPES = ["https://www.googleapis.com/auth/calendar"]

flow = InstalledAppFlow.from_client_secrets_file("oauth_client.json", SCOPES)
creds = flow.run_local_server(port=0)

token_data = {
    "token":         creds.token,
    "refresh_token": creds.refresh_token,
    "token_uri":     creds.token_uri,
    "client_id":     creds.client_id,
    "client_secret": creds.client_secret,
    "scopes":        list(creds.scopes),
}
with open("google_token.json", "w") as f:
    json.dump(token_data, f, indent=2)

print("✅ Token saved to google_token.json")
