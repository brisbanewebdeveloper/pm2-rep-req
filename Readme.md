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
