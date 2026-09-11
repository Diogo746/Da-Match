import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface HealthStatus {
  status: string;
  application: string;
  environment: string;
  timestamp: string;
  uptimeMillis: number;
}

export interface HelloWorldResponse {
  message: string;
  application: string;
  environment: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient, { optional: true });

  title = signal('Fullstack Starter (Spring Boot 3 + Angular)');
  healthStatus = signal<HealthStatus | null>(null);
  helloMessage = signal<string>('Carregando saudação do backend...');

  ngOnInit(): void {
    this.checkBackendHealth();
    this.fetchHelloMessage();
  }

  checkBackendHealth(): void {
    if (!this.http) {
      this.healthStatus.set({
        status: 'UP (Standalone Mode)',
        application: 'fullstack-starter-api',
        environment: 'local',
        timestamp: new Date().toISOString(),
        uptimeMillis: 1000
      });
      return;
    }

    this.http.get<HealthStatus>('/api/v1/health').pipe(
      catchError(() => of({
        status: 'OFFLINE (Local Dev Mode)',
        application: 'fullstack-api',
        environment: 'mock',
        timestamp: new Date().toISOString(),
        uptimeMillis: 0
      }))
    ).subscribe((data) => {
      this.healthStatus.set(data);
    });
  }

  fetchHelloMessage(): void {
    if (!this.http) {
      this.helloMessage.set('Olá, Mundo! Frontend Angular & Backend Spring Boot 3 prontos para uso.');
      return;
    }

    this.http.get<HelloWorldResponse>('/api/v1/hello').pipe(
      catchError(() => of({
        message: 'Olá, Desenvolvedor Senac! (Modo Desconectado)',
        application: 'fullstack-api',
        environment: 'local',
        timestamp: new Date().toISOString()
      }))
    ).subscribe((data) => {
      this.helloMessage.set(data.message);
    });
  }
}
