'use strict';
// Preload entry for runs with capabilities.network = "none" (see guard.cjs).
require('./guard.cjs').install({ network: 'none' });
