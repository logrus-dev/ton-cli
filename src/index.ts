#!/usr/bin/env node

require("buffer");
import inquirer from 'inquirer';
import { v4 as uuidv4 } from 'uuid';
import { Address, TonClient, fromNano, toNano, Wallet } from "ton";
import config, { TonCenterApiEndpoint } from './config';
import { delay } from './helpers';
import ora from 'ora';

const getTon = async () => {
  // Create Client
  const client = new TonClient({
    endpoint: config.get('node'),
    apiKey: config.get('apiKey'),
  });

  return client;
};

const tonTransfer = async () => {
  const { addressTo, amount, privateKey } = await inquirer.prompt([
    {
      type: 'input',
      message: 'Ton account of the recipient',
      name: 'addressTo',
    },
    {
      type: 'number',
      message: 'Amount',
      name: 'amount',
    },
    {
      type: 'password',
      message: 'Private key',
      name: "privateKey",
      mask: '*',
    },
  ]);

  const secretKey = Buffer.from(privateKey, 'hex');

  const client = await getTon();

  const wallet = await client.openWalletFromSecretKey({
    workchain: 0,
    secretKey,
    type: 'org.ton.wallets.v4',
  });
  const seqno = await wallet.getSeqNo();

  await wallet.transfer({
    value: toNano(amount),
    to: Address.parseFriendly(addressTo).address,
    secretKey,
    bounce: false,
    seqno,
  });

  console.log('seqno: ', seqno);
  await waitForTransaction(wallet, seqno);

  const address = wallet.address;
  const balance = await client.getBalance(address);
  console.log("Done. Balance: ", fromNano(balance));
}

const waitForTransaction = async (wallet: Wallet, seqno: number) => {
  const spinner = ora('Waiting for transaction in blockchain').start();
  try {
    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        await delay(1500);
        currentSeqno = await wallet.getSeqNo();
    }
  } finally {
    spinner.stop();
  }
};

const createAccount = async () => {
  const { useMnemonic } = await inquirer.prompt([
    {
      type: 'list',
      message: 'Use mnemonic',
      default: true,
      name: 'useMnemonic',
      choices: [{
        value: true,
        name: 'Yes (Can be imported to Tonkeeper but less secure)',
      }, {
        value: false,
        name: 'No (Cannot be imported to Tonkeeper but more secure)',
      }]
    },
  ]);

  const client = await getTon();
  const result = await client.createNewWallet({
    type: "org.ton.wallets.v4",
    password: useMnemonic ? undefined : uuidv4() + uuidv4(),
    workchain: 0,
  });
  console.log('Address:', result.wallet.address.toFriendly());
  console.log('Public key:', result.key.publicKey.toString('hex'));
  console.log('Secret key:', result.key.secretKey.toString('hex'));
  if (useMnemonic) {
    console.log('Mnemonic', result.mnemonic);
  }
};

const getAccount = async () => {
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      message: 'TON account address',
      name: 'address',
    }
  ]);

  const client = await getTon();
  const balance = await client.getBalance(Address.parse(address));
  console.log(`💎 ${fromNano(balance)}`);
}

const commands: { [key: string]: () => Promise<void> } = {
  'ton-transfer': tonTransfer,

  'create-account': createAccount,
  'get-account': getAccount,
};

const handleErrors = (cb: (...args: any[]) => Promise<void>) => async (...args: any[]) => {
  try {
    await cb(...args);
  } catch (e: any) {
    console.error(e.message);
  }
};

(async () => {
  if (!config.get('apiKey') && config.get('node') === TonCenterApiEndpoint) {
    console.warn('\x1b[33m%s\x1b[0m', 'toncenter.com\'s API requires an API key to work properly. Obtain one at https://t.me/tonapibot');
    return;
  }
  while (true) {
    const { command } = await inquirer.prompt([
      {
        type: 'list',
        message: 'Choose Ton network command',
        name: 'command',
        choices: [...Object.keys(commands), 'exit'],
        loop: false,
      }
    ]);
    if (command === 'exit') {
      return;
    }
    await handleErrors(commands[command])();
  }
})();
