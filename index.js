/**
 * https://github.com/Unitech/pm2-axon
 */

'use strict';

const pm2 = require('pm2');
const axon = require('pm2-axon');

class Pm2RepReq {

  constructor (options) {

    this.verbose = options.verbose;
    this.worker = options.worker;
    this.port = options.port;
    this.cb = options.cb;

    if (options.worker)  {
      const argv = require('argv');
      options.args.map(a => argv.option(a));
      this.args = argv.run();
      this.sock = axon.socket('req');
    } else {
      this.name = options.name;
      this.script = options.script;
      this.instances = options.instances;
      this.args = options.args;
      this.sock = axon.socket('rep');
    }
  }

  async run () {

    if (this.worker)  {
      if (this.verbose) console.log(`Connecting to Master via Port ${this.port}`);
      this.sock.connect(this.port);
      this.cb(this.args, this.sock);
    } else {

      await new Promise((resolve, error) => {
        pm2.delete(this.name, err => {
          if (err) {
            //console.error('!!! Failed at deleting app', err);
          } else {
            if (this.verbose) console.log(`Deleted workers`);
          }
          resolve();
        });
      });

      const promise = new Promise(resolve => {
        if (this.verbose) console.log(`Binding to Port ${this.port}`);
        this.sock.bind(this.port);
        this.sock.on('message', (task, data, reply) => {
          if (this.cb(task, data, reply)) resolve();
        });
      });

      pm2.start({
        name: this.name,
        script: this.script,
        exec_mode: 'cluster',
        instances: this.instances,
        args: this.args,
      }, async (err, apps) => {
        if (err) {
          if (this.verbose) console.error('Failed at starting Master', err);
        } else {
          if (this.verbose) console.log('Master is ready');
        }
      });

      await promise;

      await new Promise((resolve => {
        if (this.verbose) console.log('Deleting Worker');
        pm2.delete(this.name, err => {
          if (err) console.log(err);
          if (this.verbose) console.log('Finishing Master');
          pm2.disconnect();
          resolve();
        });
      }));
    }
  }
}

module.exports = Pm2RepReq;
