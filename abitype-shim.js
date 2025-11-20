// Shim temporaire pour satisfaire les imports ox / @walletconnect/utils.
// À utiliser seulement si abitype réel ne fournit pas les exports attendus.
export function parseAbi(a) { return a; }
export function parseAbiItem(i) { return i; }
export function parseAbiParameters(p) { return p; }
export function formatAbi(abi) { return abi; }
export function formatAbiItem(item) { return item; }
export function formatAbiParameters(params) { return params; }