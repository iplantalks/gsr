# Google Sheets Reader

Small cloudflare worker to expose Google Sheets to frontend

Key idea here is that whenever we want to publish some Google Sheet

We are going to add our service account to it

```
serviceaccount@iplantalks.iam.gserviceaccount.com
```

And from an frontend we can retrieve data like so:

```js
var url = new URL('https://gsr.iplan-talks.workers.dev')
url.searchParams.set('sheet', 'xxxxx')
url.searchParams.set('range', 'Sheet1!A:B')
var values = await fetc(url).then(res => res.json())
console.log(value)
```

## Development

```
npm i
npm start
open http://localhost:8787
```

## Deployment

Deployment are automated and done behind the scene after merge to main branch

To deploy manually you need two environment variables:

Account identifier pointing to italks cloudflare account

```bash
export CLOUDFLARE_ACCOUNT_ID=xxxxxxxxx
```

Your token

```bash
export CLOUDFLARE_API_TOKEN=xxxxxxxxxx
```

Token can be created [here](https://dash.cloudflare.com/profile/api-tokens), use "Edit Cloudflare Workers" template, it has all required permissions

Both environment variables are added as secrets to github, for automated deployments

In case if you already have tokens for other accounts just save them to another wariable and do soemthing like this:

```bash
export CLOUDFLARE_ACCOUNT_ID=$ITALKS_CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN=$ITALKS_CLOUDFLARE_API_TOKEN
npm run deploy
```
