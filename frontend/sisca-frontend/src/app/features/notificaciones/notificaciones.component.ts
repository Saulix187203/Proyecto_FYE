import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notificacion } from '../../core/models/notificacion.model';
import { NotificacionesService } from './notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Notificaciones</h2>
    <button (click)="marcarTodas()" style="margin-bottom:1rem;">Marcar todas como leídas</button>
    <ul>
      <li *ngFor="let n of notificaciones" [style.font-weight]="n.leida ? 'normal' : 'bold'">
        {{ n.titulo }} - {{ n.mensaje }} ({{ n.fecha | date:'short' }})
        <button *ngIf="!n.leida" (click)="marcarLeida(n.id)">Marcar leída</button>
      </li>
    </ul>
    <div *ngIf="!notificaciones || notificaciones.length === 0">No hay notificaciones.</div>
  `
})
export class NotificacionesComponent implements OnInit {
  private notificacionesService = inject(NotificacionesService);
  notificaciones: Notificacion[] = [];

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.notificacionesService.listar().subscribe({
      next: (data) => {
        this.notificaciones = data;
        console.log('Notificaciones cargadas:', this.notificaciones);
      },
      error: (err) => console.error('Error cargando notificaciones', err)
    });
  }

  marcarLeida(id: number) {
    this.notificacionesService.marcarLeida(id).subscribe({
      next: () => this.cargar(),
      error: (err) => console.error('Error marcando leída', err)
    });
  }

  marcarTodas() {
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => this.cargar(),
      error: (err) => console.error('Error marcando todas', err)
    });
  }
}