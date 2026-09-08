# Security Policy

## Supported version

Security fixes are provided for the latest release. Version 2.1.0 is the current hardened public-client baseline.

## Public-client security model

- The web app is static and contains no administrative credential.
- It reads only an exact board's sanitized `/public` Firebase child.
- Firebase rules must deny all browser writes, root listing, and board-root reads.
- The page accepts only HTTPS `firebaseio.com` or `firebasedatabase.app` database hosts.
- Data is rendered with DOM nodes and `textContent`, not untrusted HTML strings.
- A restrictive CSP limits scripts, styles, images, and network connections.
- Requests omit credentials, reject redirects, send no referrer, time out, and stop reading after 512 KiB.
- Missing or invalid Firebase configuration fails closed; demo content is disabled unless `demoMode: true` is explicitly selected for a local visual demonstration.

## Security boundary

The board URL is public. This release does not authenticate viewers or issue signed private links. A private-overlay requirement needs a different architecture.

## Reporting a vulnerability

Report privately to **[SECURITY CONTACT]**. Include:

- affected URL or version;
- reproduction steps;
- expected and observed behavior;
- potential impact;
- screenshots or minimal proof-of-concept material that does not expose other users' data.

Do not publish credentials, exploit other boards, create excessive traffic, or access data beyond what is necessary to demonstrate the issue.
