import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { Injector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should instantiate component and define default values', () => {
    const injector = createEnvironmentInjector([], Injector.NULL);
    const comp = runInInjectionContext(injector, () => new AppComponent());
    expect(comp).toBeDefined();
    expect(comp.title()).toContain('Fullstack Starter');
    expect(comp.healthStatus()).toBeNull();
  });

  it('should initialize and execute health check and greeting fetch in standalone mode', () => {
    const injector = createEnvironmentInjector([], Injector.NULL);
    const comp = runInInjectionContext(injector, () => new AppComponent());
    comp.ngOnInit();
    expect(comp.helloMessage()).toContain('Olá, Mundo!');
    expect(comp.healthStatus()?.status).toContain('UP');
  });
});
