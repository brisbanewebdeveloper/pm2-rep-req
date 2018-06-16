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
      this.deleteOnComplete = options.deleteOnComplete;
      this.onIdle = options.onIdle;

      this.options = Object.assign({
        name: this.name,
        script: this.script,
        exec_mode: 'cluster',
        instances: this.instances,
        args: this.args,
      }, options.options);
    }
  }

  async finish () {
    return new Promise((resolve => {
      if (this.verbose) console.log('Deleting Worker');
      pm2.delete(this.name, err => {
        if (err) console.log(err);
        if (this.verbose) console.log('Finishing Worker');
        pm2.disconnect();
        this.sock.close();
        resolve();
      });
    }));
  }

  async process (err, apps) {

    const onIdle = this.onIdle;

    return new Promise((resolve, error) => {
      function polling () {
        if (onIdle()) {
          resolve();
        } else {
          setTimeout(polling, 1);
        }
      }
      polling();
    });
  }

  async reload () {
    return new Promise((resolve, error) => {
      pm2.reload(this.name, async (err, apps) => {
        if (err) {
          if (this.verbose) console.error('Failed at reloading Worker', err);
          error(err);
        } else {
          if (this.verbose) console.log('Reloaded Worker');
          await this.process(err, apps);
          resolve();
        }
      });
    });
  }

  async run () {

    const self = this;

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

      if (this.verbose) console.log(`Binding to Port ${this.port}`);
      this.sock.bind(this.port);
      process.on('SIGINT', function() {
        console.log(`Closing Port ${self.port}`);
        self.sock.close();
        process.exit(1);
      });

      this.sock.on('message', (task, data, reply) => {
        this.cb(task, data, reply);
      });

      await new Promise((resolve, error) => {
        pm2.start(
          this.options,
          async (err, apps) => {
            if (err) {
              if (this.verbose) console.error('Failed at starting Worker', err);
              error(err);
            } else {
              if (this.verbose) console.log('Started Worker');
              await this.process(err, apps);
              resolve();
            }
          }
        );
      });

      if (this.deleteOnComplete) await this.finish();
    }
  }
}

module.exports = Pm2RepReq;
