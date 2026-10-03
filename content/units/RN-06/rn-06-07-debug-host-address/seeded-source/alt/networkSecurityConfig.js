// The contents of android/app/src/debug/res/xml/network_security_config.xml, kept in a JS string.
export const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<!-- Debug-only: plain HTTP to the development hosts and nowhere else (no base-config: the default stays). -->
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">10.0.2.2</domain>
  </domain-config>
</network-security-config>`;
