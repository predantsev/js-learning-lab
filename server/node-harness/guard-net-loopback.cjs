'use strict';
// Preload entry for runs with capabilities.network = "loopback" (see guard.cjs).
require('./guard.cjs').install({ network: 'loopback' });
