// The contents of android/app/src/debug/res/xml/network_security_config.xml, kept in a JS string.
export const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<!-- Wrong on purpose: plain HTTP allowed to every host, not only to the development hosts. -->
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
</network-security-config>`;
