# PM2 Rep/Req

This package let you cluster with PM2 and Axon by using Req / Rep model.

## Installation

```shell
npm install pm2 -g
npm install hironozu/pm2-rep-req
```

## Example

example.js shows you the example.

```shell
mkdir -p /somewhere/hironozu/pm2-rep-req
cd /usr/local/src/hironozu/pm2-rep-req
git clone git@github.com:hironozu/pm2-rep-req.git .
npm install
time node example.js
```

## Parameters

### Pm2RepReq(options)


#### Worker Side

##### verbose: boolean

Set true to see a message from this package.

##### worker: boolean

Always set true for Worker.

##### port: integer

Port to send/receive the message with Master.

##### cb: function (args, sock)

Callback when receiving the message from Master.

##### args: options,

Options for `argv`. Useful to put the logic on both side.


#### Master Side

##### verbose: boolean

Set true to see a message from this package.

##### worker: boolean

Always set false for Master.

##### port: integer

Port to send/receive the message with Master.

##### cb: (task, data, reply)

Callback when receiving the message from Worker.

##### name: string

The name used for PM2 to interact with

##### script: string

The path of the script to run for PM2.

##### instances: integer

The number of instances of script to create.

##### args: string

Options for `argv`. Useful to put the logic on both side.

##### deleteOnComplete: boolean

Set true to delete Worker upon completing the task at Master-side.

##### onIdle: function

Function to check if the task is finished.

##### beforeStart: function

Function called before starting PM2.

##### options: Object

Extra option to pass to [pm2.start()](http://pm2.keymetrics.io/docs/usage/pm2-api/#programmatic-api).

##### finish()

Use this method if you set false to `deleteOnComplete` to delete Worker.

##### process()

This makes Master wait for the request from Worker.

##### reload()

##### run()
