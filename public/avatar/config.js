/**
 * A página funciona visualmente sem backend. Para habilitar conversa real,
 * troque `null` por `/avatar`, servido na MESMA origem HTTPS e implementando o
 * contrato Jarvis. Uma origem externa é recusada pelo cliente.
 * Nunca coloque token ou segredo neste arquivo público.
 */
globalThis.JARVIS_CONFIG ??= Object.freeze({
  apiBaseUrl: null,
  // Só é necessário se outro site HTTPS for embutir esta página e entregar um
  // bilhete por postMessage. Use origens exatas, nunca `*`.
  allowedParentOrigins: Object.freeze([]),
});
