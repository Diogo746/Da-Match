import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of, Subscription, timer } from 'rxjs';

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
export class AppComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient, { optional: true });
  private readonly backendApiUrl = 'https://da-match.onrender.com';
  private healthCheckSubscription?: Subscription;

  title = signal('Fullstack Starter (Spring Boot 3 + Angular)');
  healthStatus = signal<HealthStatus | null>(null);
  helloMessage = signal<string>('Carregando saudação do backend...');

  ngOnInit(): void {
    this.startHealthChecks();
    this.fetchHelloMessage();
  }

  ngOnDestroy(): void {
    this.healthCheckSubscription?.unsubscribe();
  }

  private startHealthChecks(): void {
    if (!this.http) {
      this.checkBackendHealth();
      return;
    }

    // Checks immediately and every 45 seconds while the frontend is open.
    this.healthCheckSubscription = timer(0, 45_000).subscribe(() => this.checkBackendHealth());
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

    this.http.get<HealthStatus>(`${this.backendApiUrl}/api/v1/health`).pipe(
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

    this.http.get<HelloWorldResponse>(`${this.backendApiUrl}/api/v1/hello`).pipe(
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
