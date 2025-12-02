import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { BienvenidoComponent } from './bienvenido/bienvenido';
import { SolicitudesComponent } from './solicitudes/solicitudes';
import { ReportesComponent } from './reportes/reportes'; 
import { HistorialComponent } from './historial/historial';
import { NotificacionesComponent } from './notificaciones/notificaciones';
import { DashboardComponent } from './dashboard/dashboard';
import { InspeccionesComponent } from './inspecciones/inspecciones';
import { InformeComponent} from './informe/informe';
import { LocalesComponent} from './locales/locales';
import { AjustesComponent} from './ajustes/ajustes';
import { MapLocalesComponent }  from './map-locales/map-locales';
import { FiscalizacionComponent }  from './fiscalizacion/fiscalizacion';
import { PerfilComponent } from './perfil/perfil';
import { HistorialInspeccionesComponent } from './historial-inspecciones/historial-inspecciones';
import { CalendarioComponent } from './calendario/calendario';





export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'bienvenido', component: BienvenidoComponent },
  { path: 'solicitudes', component: SolicitudesComponent },
  { path: 'reportes', component: ReportesComponent }, 
  { path: 'historial', component: HistorialComponent },
  { path: 'notificaciones', component: NotificacionesComponent },
  { path: 'dashboard', component: DashboardComponent },
   { path:'inspecciones', component: InspeccionesComponent },
  { path: 'historial-inspecciones', component: HistorialInspeccionesComponent },
  { path:'informe', component: InformeComponent },
  { path:'locales', component: LocalesComponent },
  { path:'ajustes', component: AjustesComponent },
    { path:'maplocales', component: MapLocalesComponent },
     { path:'fiscalizacion', component: FiscalizacionComponent },
      { path: 'perfil', component: PerfilComponent },
      { path: 'calendario', component: CalendarioComponent },



];