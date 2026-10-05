// The contents of android/app/src/debug/res/xml/network_security_config.xml, kept in a JS string.
export const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<!-- Debug-only Android network security configuration of the expenses app. -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">10.0.2.2</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
  </domain-config>
</network-security-config>`;
