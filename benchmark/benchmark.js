#!/usr/bin/env node

'use strict';

/*eslint-disable no-console*/

const path      = require('path');
const fs        = require('fs');
const Benchmark = require('benchmark');


const IMPLS_DIRECTORY = path.join(__dirname, 'implementations');
const IMPLS = [];


fs.readdirSync(IMPLS_DIRECTORY).sort().forEach(name => {
  const file = path.join(IMPLS_DIRECTORY, name);
  const code = require(file);

  IMPLS.push({ name, code });
});

let suite;

function run(suite) {
  suite
    .on('start', () => console.log(`${suite.name}\n`))
    .on('cycle', e => console.log(`  > ${e.target}`))
    .on('complete', () => console.log(''))
    .run();
}


const SAMPLES = {
  big: fs.readFileSync(path.join(__dirname, 'samples/big.txt'), 'utf8'),
  one_path: fs.readFileSync(path.join(__dirname, 'samples/one_path.txt'), 'utf8')
};


suite = new Benchmark.Suite('.from("big.txt")');

IMPLS.forEach(impl => {
  suite.add(impl.name, () => impl.code.from(SAMPLES.big));
});

run(suite);


suite = new Benchmark.Suite('.from("one_path.txt")');

IMPLS.forEach(impl => {
  suite.add(impl.name, () => impl.code.from(SAMPLES.one_path));
});

run(suite);


const long = 'M 4.8173765432098765 -9.12666320366964 Z'.repeat(5000);

suite = new Benchmark.Suite('.from(long).toString()');

IMPLS.forEach(impl => {
  suite.add(impl.name, () => impl.code.from(long).toString());
});

run(suite);
