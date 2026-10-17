import { afterEach, describe, expect, it, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MotionStore } from "./motion.store";
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
afterEach(() => {
  vi.restoreAllMocks();
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else Reflect.deleteProperty(window, "matchMedia");
});
describe("Preferências de movimento", () => {
  it("permite pausar as reações e retomar durante a mesma sessão", () => {
    const motion=TestBed.inject(MotionStore);
    expect(motion.allowed()).toBe(true);
    motion.paused.set(true);
    expect(motion.allowed()).toBe(false);
    motion.paused.set(false);
    expect(motion.allowed()).toBe(true);
  });
  it("acompanha a preferência do dispositivo e remove o observador ao encerrar", () => {
    let callback: ((event: MediaQueryListEvent) => void) | undefined;
    const remove=vi.fn();
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({
      matches: true, media: "(prefers-reduced-motion: reduce)",
      addEventListener: (_name:string, listener: (event:MediaQueryListEvent)=>void) => { callback=listener; },
      removeEventListener: remove,
    } as unknown as MediaQueryList) });
    const motion=TestBed.inject(MotionStore);
    expect(motion.allowed()).toBe(false);
    callback!({ matches:false } as MediaQueryListEvent);
    expect(motion.allowed()).toBe(true);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalled();
  });
});

