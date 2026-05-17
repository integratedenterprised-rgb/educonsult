/**
 * Test shim for `server-only`. The real package errors when imported into a
 * client bundle; in a Node test runner that protection isn't needed, so we
 * stub it out.
 */
export {};
