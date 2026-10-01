'use strict';
// Platform guard for isolated Node runs. Preloaded with --require (through guard-net-*.cjs) into
// the main thread and into every worker thread, before any learner code runs.
//
// It is a seat belt on top of Node's permission model, not a security boundary: code in the same
// process that deliberately reaches internal handles can get around it. It exists to stop honest
// mistakes with a clear message, and to cover what the permission model does not:
//   - network host policy (Node <25 has no network permission; Node 25 has only all-or-nothing),
//   - node:sqlite file paths (node:sqlite does not consult the permission model),
//   - worker execArgv (a worker given its own execArgv starts WITHOUT the permission model),
//   - signals to other processes (process.kill is not covered by the permission model).
// The enforcement table in docs/platform/SERVER-API.md says which layer covers what.

const net = require('node:net');
const dgram = require('node:dgram');
const dns = require('node:dns');
const path = require('node:path');
const nodeModule = require('node:module');
const workerThreads = require('node:worker_threads');

const POLICY = 'ERR_JSLL_POLICY';

function policyError(message, capability) {
  const error = new Error(message);
  error.code = POLICY;
  error.capability = capability;
  return error;
}

const allowed = (permission, file) => {
  try {
    return Boolean(process.permission && process.permission.has(permission, file));
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------- network
function isLoopbackHost(host) {
  if (typeof host !== 'string') return false;
  let h = host.trim().toLowerCase();
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
  if (h === 'localhost') return true;
  const family = net.isIP(h);
  if (family === 4) return h.startsWith('127.');
  if (family === 6) {
    if (h === '::1' || /^(0{1,4}:){7}0{0,3}1$/.test(h)) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
    return mapped !== null && mapped[1].startsWith('127.');
  }
  return false;
}

const isPortLike = (value) => typeof value === 'number' || (typeof value === 'string' && /^\s*\d+\s*$/.test(value));
const socketPathAllowed = (p) => typeof p === 'string' && !p.startsWith('\\\\') && allowed('fs.write', path.resolve(p));

function installNetwork(mode) {
  const off = (what) => policyError(`Network access is turned off for this exercise (network: "none"): ${what} was blocked.`, 'network');
  const wrap = (owner, name, check) => {
    const raw = owner[name];
    if (typeof raw !== 'function') return;
    owner[name] = function guarded(...args) {
      check.call(this, args);
      return raw.apply(this, args);
    };
    Object.defineProperty(owner[name], 'name', { value: name });
  };

  // TCP clients, TLS, HTTP(S), HTTP/2 and fetch() all end up in Socket.prototype.connect.
  wrap(net.Socket.prototype, 'connect', (args) => {
    let first = args[0];
    if (Array.isArray(first)) first = first[0]; // already normalized by net.connect()
    let target;
    if (first !== null && typeof first === 'object') target = typeof first.path === 'string' ? { path: first.path } : { host: first.host ?? 'localhost', port: first.port };
    else if (typeof first === 'string' && !isPortLike(first)) target = { path: first };
    else target = { host: typeof args[1] === 'string' ? args[1] : 'localhost', port: first };
    const shown = target.path !== undefined ? `a connection to the socket ${JSON.stringify(String(target.path))}` : `a connection to ${target.host}:${target.port}`;
    if (mode === 'none') throw off(shown);
    if (target.path !== undefined) {
      if (!socketPathAllowed(target.path)) throw policyError(`Only sockets inside the exercise folder are reachable: ${shown} was blocked.`, 'network');
    } else if (!isLoopbackHost(String(target.host))) {
      throw policyError(`This exercise only allows loopback network access (127.0.0.1, ::1, localhost): ${shown} was blocked.`, 'network');
    }
  });

  wrap(net.Server.prototype, 'listen', (args) => {
    const first = args[0];
    let target;
    if (first !== null && typeof first === 'object') {
      if (first._handle !== undefined || first.handle !== undefined || first.fd !== undefined) throw policyError('Listening on an existing handle or file descriptor is not available in the course runner.', 'network');
      target = typeof first.path === 'string' ? { path: first.path } : { host: first.host, port: first.port };
    } else if (typeof first === 'string' && !isPortLike(first)) target = { path: first };
    else target = { host: typeof args[1] === 'string' ? args[1] : undefined, port: first };
    if (mode === 'none') throw off(target.path !== undefined ? `listening on ${JSON.stringify(String(target.path))}` : `listening on port ${target.port ?? 0}`);
    if (target.path !== undefined) {
      if (!socketPathAllowed(target.path)) throw policyError(`Servers may only listen on sockets inside the exercise folder: ${JSON.stringify(String(target.path))} was blocked.`, 'network');
      return;
    }
    if (target.host === undefined || target.host === null) {
      throw policyError(`server.listen() needs an explicit loopback host in the course runner. Without one the server would accept connections from other computers on your network. Use server.listen(${isPortLike(target.port) ? Number(target.port) : 3000}, '127.0.0.1').`, 'network');
    }
    if (!isLoopbackHost(String(target.host))) throw policyError(`Servers may only listen on a loopback address (127.0.0.1, ::1, localhost); "${target.host}" was blocked.`, 'network');
  });

  const udpTarget = (args, addressIndex) => (typeof args[addressIndex] === 'string' ? args[addressIndex] : undefined);
  wrap(dgram.Socket.prototype, 'bind', (args) => {
    if (mode === 'none') throw off('binding a UDP socket');
    const first = args[0];
    const address = first !== null && typeof first === 'object' ? first.address : udpTarget(args, 1);
    if (!isLoopbackHost(String(address))) throw policyError('UDP sockets must bind to a loopback address in the course runner, for example socket.bind(41234, \'127.0.0.1\').', 'network');
  });
  wrap(dgram.Socket.prototype, 'connect', (args) => {
    if (mode === 'none') throw off('connecting a UDP socket');
    const address = udpTarget(args, 1) ?? 'localhost';
    if (!isLoopbackHost(address)) throw policyError(`UDP traffic is limited to loopback addresses: ${address} was blocked.`, 'network');
  });
  wrap(dgram.Socket.prototype, 'send', (args) => {
    if (mode === 'none') throw off('sending a UDP datagram');
    const offsetForm = typeof args[1] === 'number' && typeof args[2] === 'number' && args.length >= 4 && typeof args[3] === 'number';
    const address = udpTarget(args, offsetForm ? 4 : 2);
    if (address !== undefined && !isLoopbackHost(address)) throw policyError(`UDP traffic is limited to loopback addresses: ${address} was blocked.`, 'network');
  });

  // DNS: in "none" nothing resolves; in "loopback" only names of this computer do.
  const dnsCheck = (kind) => (args) => {
    const name = args[0];
    if (mode === 'none') throw off(`resolving ${JSON.stringify(String(name))}`);
    if (kind === 'lookup' && isLoopbackHost(String(name))) return;
    throw policyError(`This exercise only allows loopback network access: resolving ${JSON.stringify(String(name))} was blocked.`, 'network');
  };
  const dnsNames = (owner) => Object.keys(owner).filter((k) => typeof owner[k] === 'function' && /^(lookup|lookupService|resolve|resolve[A-Z].*|reverse)$/.test(k));
  for (const owner of [dns, dns.promises]) for (const name of dnsNames(owner)) wrap(owner, name, dnsCheck(name.startsWith('lookup') ? 'lookup' : 'resolve'));
  for (const Resolver of [dns.Resolver, dns.promises.Resolver]) {
    if (typeof Resolver !== 'function') continue;
    for (const name of Object.getOwnPropertyNames(Resolver.prototype).filter((k) => /^(resolve|resolve[A-Z].*|reverse)$/.test(k))) wrap(Resolver.prototype, name, dnsCheck('resolve'));
  }
}

// ---------------------------------------------------------------- node:sqlite
const SQL_BLOCKED = [
  [/\battach\b/i, 'ATTACH DATABASE'],
  [/\bvacuum\b[\s\S]*?\binto\b/i, 'VACUUM INTO'],
  [/\b(temp_store_directory|data_store_directory)\b/i, 'changing SQLite storage directories'],
];

function checkSql(sql) {
  const text = String(sql);
  for (const [pattern, what] of SQL_BLOCKED) {
    if (pattern.test(text)) throw policyError(`${what} is not available in the course runner: it can open files outside the exercise folder. (The check looks for the keyword, so it also fires inside string literals.)`, 'sqlite');
  }
}

function databaseLocation(location) {
  if (location === undefined || location === null) return null;
  let value = location;
  if (Buffer.isBuffer(value)) value = value.toString('utf8');
  if (value instanceof URL) value = value.href;
  value = String(value);
  if (value === ':memory:') return ':memory:';
  if (value.startsWith('file:')) {
    if (/^file::memory:/.test(value) || /[?&]mode=memory\b/.test(value)) return ':memory:';
    try {
      const url = new URL(value.startsWith('file://') ? value : `file:${path.resolve(decodeURIComponent(value.slice(5).split('?')[0]))}`);
      return path.resolve(decodeURIComponent(url.pathname));
    } catch {
      return value;
    }
  }
  return path.resolve(value);
}

function checkDatabasePath(location, write = true) {
  const resolved = databaseLocation(location);
  if (resolved === ':memory:') return;
  if (resolved === null || resolved === '') throw policyError('Open SQLite databases as ":memory:" or as a file inside the exercise folder (temporary databases are created outside it).', 'sqlite');
  if (!allowed('fs.read', resolved) || (write && !allowed('fs.write', resolved))) {
    throw policyError(`SQLite databases must live inside the exercise folder: ${JSON.stringify(String(location))} is outside it.`, 'sqlite');
  }
}

function installSqlite() {
  let sqlite;
  try {
    sqlite = require('node:sqlite');
  } catch {
    return; // this Node build has no node:sqlite
  }
  const Original = sqlite.DatabaseSync;
  if (typeof Original !== 'function') return;
  const Guarded = new Proxy(Original, {
    construct(target, args, newTarget) {
      const options = args[1];
      if (options && typeof options === 'object' && options.allowExtension) throw policyError('Loading SQLite extensions is not available in the course runner.', 'sqlite');
      checkDatabasePath(args[0], !(options && options.readOnly));
      return Reflect.construct(target, args, newTarget === Guarded ? target : newTarget);
    },
  });
  // Instances must not lead back to the unguarded constructor.
  Object.defineProperty(Original.prototype, 'constructor', { value: Guarded, writable: false, configurable: false, enumerable: false });
  const proto = Original.prototype;
  for (const name of ['exec', 'prepare']) {
    const raw = proto[name];
    if (typeof raw !== 'function') continue;
    Object.defineProperty(proto, name, { value: function guardedSql(sql, ...rest) { checkSql(sql); return raw.call(this, sql, ...rest); }, writable: false, configurable: false });
  }
  if (typeof proto.createTagStore === 'function') {
    const rawCreate = proto.createTagStore;
    Object.defineProperty(proto, 'createTagStore', {
      value: function guardedTagStore(...args) {
        const store = rawCreate.apply(this, args);
        const storeProto = Object.getPrototypeOf(store);
        for (const name of Object.getOwnPropertyNames(storeProto)) {
          const raw = storeProto[name];
          if (name === 'constructor' || typeof raw !== 'function' || raw.__jsllGuarded) continue;
          const guarded = function guardedTag(strings, ...values) {
            if (Array.isArray(strings)) checkSql(strings.join(' ? '));
            return raw.call(this, strings, ...values);
          };
          guarded.__jsllGuarded = true;
          try { Object.defineProperty(storeProto, name, { value: guarded, writable: false, configurable: false }); } catch { /* already locked */ }
        }
        return store;
      },
      writable: false,
      configurable: false,
    });
  }
  sqlite.DatabaseSync = Guarded;
  if (typeof sqlite.backup === 'function') {
    const rawBackup = sqlite.backup;
    sqlite.backup = function backup(source, destination, ...rest) {
      checkDatabasePath(destination, true);
      return rawBackup.call(this, source, destination, ...rest);
    };
  }
}

// ---------------------------------------------------------------- workers
function installWorkers() {
  const Original = workerThreads.Worker;
  if (typeof Original !== 'function') return;
  const Guarded = new Proxy(Original, {
    construct(target, args, newTarget) {
      const options = args[1];
      if (options && typeof options === 'object' && options.execArgv !== undefined) {
        throw policyError('Worker "execArgv" is not available in the course runner: a worker started with its own execArgv would run without the permission model.', 'workers');
      }
      return Reflect.construct(target, args, newTarget === Guarded ? target : newTarget);
    },
  });
  Object.defineProperty(Original.prototype, 'constructor', { value: Guarded, writable: false, configurable: false, enumerable: false });
  workerThreads.Worker = Guarded;
}

// ---------------------------------------------------------------- signals
function installSignals() {
  const rawKill = process._kill;
  if (typeof rawKill !== 'function') return;
  Object.defineProperty(process, '_kill', {
    value: function kill(pid, signal) {
      if (pid !== process.pid) throw policyError(`Sending signals to other processes is not available in the course runner (pid ${pid}). process.kill(process.pid, signal) still works.`, 'signals');
      return rawKill.call(process, pid, signal);
    },
    writable: false,
    configurable: false,
  });
}

// ---------------------------------------------------------------- module resolution
// A bare import such as `import express from "express"` either finds nothing or walks up to
// node_modules folders outside the exercise folder, which the permission model reports as
// ERR_ACCESS_DENIED. Either way, say what it means.
const BARE = /^(?![./]|[a-zA-Z]+:|#)/;
function installResolveHint() {
  if (typeof nodeModule.registerHooks !== 'function') return;
  nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (error) {
        if (error && (error.code === 'ERR_ACCESS_DENIED' || error.code === 'ERR_MODULE_NOT_FOUND') && BARE.test(specifier) && !nodeModule.isBuiltin(specifier)) {
          const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
          const hint = new Error(`Cannot find package '${name}'. The course runner does not install npm packages: import Node built-in modules (node:fs, node:http, …) or files from this exercise.`);
          hint.code = 'ERR_MODULE_NOT_FOUND';
          throw hint;
        }
        throw error;
      }
    },
  });
}

// ---------------------------------------------------------------- orphan watchdog
// If the platform server dies, its runs must not live on. Unreferenced: it never keeps the
// process alive and does not appear in process.getActiveResourcesInfo().
function installWatchdog() {
  if (!workerThreads.isMainThread) return;
  const parent = process.ppid;
  const exit = process.reallyExit ? process.reallyExit.bind(process) : process.exit.bind(process);
  setInterval(() => {
    if (process.ppid !== parent) exit(137);
  }, 1000).unref();
}

// ---------------------------------------------------------------- output
// On macOS pipe writes are asynchronous: while a synchronous loop blocks the event loop, output
// queues in memory instead of reaching the platform, so a print flood ends in a heap crash
// rather than at the output cap and earlier lines can be stuck. Blocking pipe writes (what
// Linux does anyway) deliver output as it is produced and let the output cap apply.
function installBlockingOutput() {
  if (!workerThreads.isMainThread) return;
  for (const name of ['stdout', 'stderr']) {
    try {
      const handle = process[name]._handle;
      if (handle && typeof handle.setBlocking === 'function') handle.setBlocking(true);
    } catch {
      /* not a pipe */
    }
  }
}

function install({ network }) {
  installBlockingOutput();
  installNetwork(network === 'loopback' ? 'loopback' : 'none');
  installSqlite();
  installWorkers();
  installSignals();
  installResolveHint();
  installWatchdog();
  nodeModule.syncBuiltinESMExports();
}

module.exports = { install, isLoopbackHost, POLICY };
