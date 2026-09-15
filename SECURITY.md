# Security — web v2.4.0

The site is static and contains no Discord token or Firebase administrative credential. It reads only the exact sanitized Firebase `/public` path selected by a valid Discord guild/channel URL.

The pages use a restrictive Content Security Policy, `no-referrer`, bounded response reads, `cache: no-store`, no credentialed fetches, no HTML-string injection sinks, and normalized untrusted display values.

Firebase EventSource streaming is used only for the public endpoint; 5-second polling remains a fallback. Channel URLs are public to anyone who receives them.
