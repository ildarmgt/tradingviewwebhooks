## Node server for reacting to tradingview strategy webhooks

Notes mostly for myself

1. Install node modules

```
npm i
```

2. create `settings.json`

This example_settings.json creates 2 commands `CMD` with instructions of which coin to buy or sell on which exchange (using ccxt id's) with keys used for that access. New commands added by making new entries in bots array.

```
{
  "port": 80,
  "bots": [
    {
      "CMD": "BOT1 BUY BTCUSDT",
      "COIN1": "BTC",
      "COIN2": "USDT",
      "TYPE": "buy",
      "EXCHANGE": "binance",
      "API_KEY": "12345",
      "API_SECRET": "123456"
    },
    {
      "CMD": "BOT1 SELL BTCUSDT",
      "COIN1": "BTC",
      "COIN2": "USDT",
      "TYPE": "sell",
      "EXCHANGE": "binance",
      "API_KEY": "12345",
      "API_SECRET": "123456"
    }
  ]
}
```
Then run webhook server with

```
npm run start
```

Test that can access the get page request via external ip @ `/` shown to know if ports are open.

3. Create new layout on tradingview (top left corner) on Tradinvview pro w/ server-side alerts

4. Write strategy with pinescript.

Simple pinescript example here only to demonstrate specific settings that have worked for alerts for me. For fear of someone using it, all should know strategies can easily be unprofitable even if backtest well and there are never any guarantees.

```
//@version=4
strategy(title="some strat - bot1)", default_qty_type=strategy.percent_of_equity, default_qty_value=10, commission_type=strategy.commission.percent, commission_value=0.1, overlay=true, calc_on_every_tick=true)
// default_qty_type=strategy.percent_of_equity and default_qty_value=10 means default order 10% of account
// calc_on_every_tick=true ensures last bar state visible in strategy
// strat quantity in pinescript is only used for backtesting, node server only receives the buyMessage or sellMessage below as plain text.

buyMessage = 'BOT1 BUY BTCUSDT' // has to match some CMD in settings.json
sellMessage = 'BOT1 SELL BTCUSDT' // has to match some CMD in settings.json

// most cliche exponential moving average used for example
lengthFast = input(14)
lengthSlow = input(60)
fast = ema(hlc3, lengthFast)
slow = ema(hlc3, lengthSlow)

// barstate.isconfirmed ensures regular signal only sent once per bar
// (stop will work independently)
buySignal = fast > slow and barstate.isconfirmed
sellSignal = not buySignal and barstate.isconfirmed

// entry and trailing stop
if (buySignal)
    strategy.entry("buy", long=strategy.long, alert_message=buyMessage)
    strategy.exit("ts","buy", stop=lowest(low, lengthSlow)[1], alert_message=sellMessage)

// exit
if (sellSignal)
    strategy.close_all(true, comment="sell", alert_message=sellMessage)

// plot(fast, color=color.blue) // uncomment to plot
// plot(slow, color=color.red) // uncomment to plot
```

5. Save pinescript and add to chart. Adjust values or backtest however.
6. Right click on chart and `Add Alert...'
7. Condition: use strategy
8. Expiration time set in future (TV pro and pro+ alerts have to be remade every 2 months. Premium can click open-ended.)
9. Check (show popup or send email to know when alert goes off and) webhook URL
10. Set webhook URL to the external address of this node server shown on launch e.g. `http://123.456.789.123:80/`
11. Message should be `{{strategy.order.alert_message}}` to display the `alert_message=` seen in strategy orders
12. Hitting save activates alert and runs it server side so changes to layout or script won't affect it until alert itself is updated or replaced.

![example](https://i.imgur.com/yWwvQKh.png)

This has worked so far.

## vps to set it up on

If not running locally, before doing above, set up VPS for this purpose - remote computer. I use vultr.com w/ $5/month server (haven't tested $2.5/month version yet)

1. fund it
2. deploy new server (used cloud, w/e location, ubuntu 20.04, $5, deploy)
3. View console to get to remote termal in browser & install necessary software
```
sudo apt update
sudo apt install nodejs
sudo apt install npm # has to be done separately w/ default rep
nodejs -v # should give version
npm -v # should give version

```
4. set up ssh & sftp (e.g. `sudo apt install ssh`) to upload files easily or follow [example](http://archive.is/iiQ8t).

5. Upload files. Locally, I use midnight commander (`sudo apt install mc` & `mc`). Right > sFTP link... > `sftpuser@123.456.78.9` where latter is vps external ip address & enter password on next screen. Tab switches panels or mouse depending on terminal. Copy between pannels as normal via f5 into wherever remote sftpuser was given write permission (w/ chmod) e.g. `/home/sftpuser/`.

## To do

* logging
* display more stats on get page: P/L, overall balances per exchange, trades
* secure access to get or post w/ pass/key

## Other notes

Different TV account levels allow different number of alerts for multiple simultaneous strategies (pro+ is 30 and premium is 400 when this was written). Can also be set up to use with indicators instead of strategies but have to manually write backtesting.