// O builder oficial do Angular inicializa o TestBed e compila os templates.
// O jsdom não implementa a abertura nativa de dialog; simulamos só essa API.
if (typeof HTMLDialogElement !== "undefined") {
  if (typeof HTMLDialogElement.prototype.showModal !== "function") {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  }
  if (typeof HTMLDialogElement.prototype.close !== "function") {
    HTMLDialogElement.prototype.close = function () { this.open = false; };
  }
}
