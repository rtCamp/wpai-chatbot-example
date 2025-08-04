# Setup Documentation

> ⚠️ _Please ensure your device has sufficient storage available before starting the setup._

## STEP 1: Clone the [rtCamp/wpai-chatbot-example](https://github.com/rtCamp/wpai-chatbot-example) repository

```shell
git clone git@github.com:rtCamp/wpai-chatbot-example.git
```

## STEP 2: Set the `.env` file(s)

Copy the root `.env.example` file to `.env` in the root directory of the cloned repository, and update the environment variables as needed.

Then move the `.env` file to the respective application directories:

- `/apps/api/.env`
- `/apps/chat/.env`
- `/apps/dashboard/.env`
- `/apps/rag/.env`

> [!NOTE]
> The applications use a hard-coded reference to `RtCampCom` as the Weaviate class name. If you want to call it something else, you will need to do a search-and-replace for the reference.

## STEP 3: Install node dependencies.

```shell
npm install
```

## STEP 4: Build and run docker containers.

- Build docker in detached mode.

```shell
docker compose up --build -d
```

You can confirm that the containers are running by checking their status:

```shell
docker compose ps
```

- Start docker containers.

```shell
docker compose start
```

- Stop docker containers.

```shell
docker compose stop
```

## STEP 5: Configuring Social Connector (Google OAuth) - `LOGTO`

- Go to [Google console](https://console.cloud.google.com/) and create a new project.
- Configure the consent screen `APIs & Services > OAuth consent screen > Branding`

- Create a new OAuth client in `Credentials > Create credentials > OAuth Client ID`
- Go to `localhost:6002` and create an account.
- Create a social connector with google.
- Paste `http://localhost:6001` and callback URI `http://localhost:6001/callback/<id>` from the social connector to the Authorized JavaScript origins and Authorized redirect URIs of the OAuth client respectively.
- We'll get `client ID` and `client secret` which should be pasted in the social connector of Logto.
- Click on `Sign-in experience > Sign-up and sign-in` and remove `SIGN-UP` and `SIGN-IN` identifiers and add google in `SOCIAL SIGN-IN`.

## STEP 6: Create applications for authentication \- `LOGTO`

- Create a new `Next.js (App Router)` Application.
- Fill up the following information.
  - App name: `myBot`
  - Redirect URIs: `http://localhost:3001/callback`
  - Post sign-out redirect URIs: `http://localhost:3001/logout-callback`
- Copy the value of `APP_ID`, `APP_SECRET`, `COOKIE_SECRET` in `.env` variables.

- Create a new `Machine-to-machine` Application.
- Give the app name as `myBot` (or whatever you named it previously).
- Copy the value of `M2M_APP_ID`, `M2M_APP_SECRET` in `.env` variables.

## STEP 7: Enable the account center \- `LOGTO`

```
curl --location 'http://localhost:6001/oidc/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--user '<your-m2m-app-id>:<your-m2m-app-secret>' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'resource=https://default.logto.app/api' \
--data-urlencode 'scope=all'
```

From the above request, you'll get the `access_token`, copy the token and use in the next request.

```
curl --location --request PATCH 'http://localhost:6001/api/account-center' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <your-access-token>' \
--data '{
  "enabled": true,
  "fields": {
    "username": "ReadOnly",
    "avatar": "ReadOnly",
    "name": "ReadOnly",
    "email": "ReadOnly"
  }
}'
```

## STEP 8: Populate the vector DB

@todo

### Restore Weaviate Backup

- Get the `SSH` access of the server `ssh root@<server_ip_address>`
- Run the command to get the backup in the local system.

```shell
rsync -chavzP root@<server_ip_address>:~/weaviate_backups/ <your-local-path>
```

- Place `weaviate_backups/` _next to_ the root directory of the repo.
- Now `weaviate_backup-{*}/` will be inside `weaviate_backups/` directory.
- Run the following command **only once**.

```
curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"id": "weaviate-backup-2025-03-24"}' \
http://localhost:8080/v1/backups/filesystem/weaviate-backup-2025-03-24/restore
```

- Now check if the backup has been restored successfully or not.

```
curl http://localhost:8080/v1/backups/filesystem/weaviate-backup-2025-03-24/restore
```

```
{
  "backend": "filesystem",
  "error": "could not restore classes: [\"RtCampCom\": class name RtCampCom already exists]",
  "id": "weaviate-backup-2025-03-24",
  "path": "/var/lib/weaviate/backups/weaviate-backup-2025-03-24",
  "status": "FAILED"
}
```

- If status is failed with the above error, run the DELETE command.

```
curl -X DELETE "http://localhost:8080/v1/schema/RtCampCom"
```

- Now try restoring the backup again and check the status, if it's not failed, login to `wpai-chatbot` and ask anything related to rtCamp, it should answer the query.

## STEP 9: Configure the WordPress Backend:

- Symlink `apps/wordpress` to your WordPress plugins folder

```shell
ln -s <path/to/repo>/apps/wordpress <path/to/wordpress>/wp-content/plugins/wpai-chatbot
```

- Go to your WP Admin `Dashboard > Plugins` and activate WPAI Chatbot.
- Go to the settings page, and update the iframe URL to point to `localhost:<chat-app-port>/chat/rtcamp`

## Bonus: **Frappe Calendar Integration**

1. Visit your Frappe Dashboard and search for 'New User Appointment Availability'
2. Fill in all the details step by step
3. Fill in the personal meetings form
4. Once the steps are completed, you will be redirected to a dashboard page, copy the `**slug**` and the `**Title**` of the meeting
5. Go to the code and update the global env keys in the following way:

   ```shell
   FRAPPE_APPOINTMENT_SLUG=<slug>
   FRAPPE_APPOINTMENT_TITLE=<title>
   ```

6. Rebuild the docker and you should now be able to ask WPAI_Chatbot to book an appointment
