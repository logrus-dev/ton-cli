Basic operations with TON wallet.
- Create a TON account
- Send TON transactions

Application is 100% stateless - keys are not stored nor logged anywhere. You only enter and see them in the console.
Using community [TON js client](https://github.com/ton-community/ton) and [TON Center](https://toncenter.com/) public API. Unlike other wallets, it provides you with raw private key which gives you real ownership over your TON account.

⚠️ **You need an API key to use this tool**. Obtain one at https://t.me/tonapibot and set it either to `TON_CLI_API_KEY` environment variable or as `--api-key ***` CLI argument.

toncenter.com is the only public API node I could find. It requires an API key but it is free (up to some limits) and does not require any personal data (except for the fact you chat with their bot using a Telegram account). 5-minutes deal.

```
npx @logrus/ton-cli
```
