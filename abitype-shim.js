// SHIM TEMPORAIRE pour satisfaire ox / walletconnect si abitype réel pose problème.
// À retirer quand la version correcte d'abitype fonctionne.

export function parseAbi(a) { return a; }
export function parseAbiItem(i) { return i; }
export function parseAbiParameters(p) { return p; }
export function formatAbi(abi) { return abi; }
export function formatAbiItem(item) { return item; }
export function formatAbiParameters(params) { return params; }