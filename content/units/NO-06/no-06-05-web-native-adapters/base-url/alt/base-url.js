// The same rules with a switch statement.
export function resolveBaseUrl(target, { port, bindHost, lanAddress }) {
  switch (target) {
    case 'web':
    case 'ios-simulator':
      return 'http://127.0.0.1:' + port;
    case 'android-emulator':
      return 'http://10.0.2.2:' + port;
    case 'device':
      if (bindHost === '127.0.0.1' || bindHost === 'localhost' || bindHost === '::1') {
        throw new Error('the server listens on loopback only');
      }
      if (lanAddress === undefined || lanAddress === '') throw new Error('lanAddress is missing');
      return 'http://' + lanAddress + ':' + port;
    default:
      throw new Error('unknown target: ' + target);
  }
}
