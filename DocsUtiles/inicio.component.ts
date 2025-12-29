import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ChartOptions } from 'app/paginas/reportes/ejecionpresuestaria-chart/apexchart.component';
import { AlertasSrvService } from 'app/servicios/generico/alertas-srv.service';
import { ClienthttpCongopeService } from 'app/servicios/generico/clienthttp-congope.service';
import * as L from 'leaflet';  // Importar Leaflet


import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexFill,
  ApexTooltip,
  ApexTitleSubtitle,
  ApexGrid,
  ApexMarkers,
  ApexNonAxisChartSeries,
  ApexResponsive,
  NgApexchartsModule,
  ApexOptions,
} from 'ng-apexcharts';
import { Observable } from 'rxjs/internal/Observable';
//import { IgxGridModule } from 'igniteui-angular';
import * as $ from 'jquery'; // Importar jQuery
import { AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [BreadcrumbComponent,  NgApexchartsModule,],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})

//, AfterViewInit
export class InicioComponent implements OnInit   {
  [x: string]: any;
   // public nombreSistema:string =  "prueba";
 // public otroNombre:string=JSON.parse(sessionStorage.getItem('ParamSesiones')?.toString() ?? '{}')
  public nombreSistema:string=  sessionStorage.getItem('NombreMenu')?.toString() ?? '{}';
  //@ViewChild("map", { static: true })
  //public map: IgxGeographicMapComponent;

 // public barChartOptions: Partial<ChartOptions>= {}; 
  alertas: any;

  public barChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      foreColor: '#9aa0ac',
    },
    series: [
      {
        name: 'Ventas',
        data: [30, 40, 45, 50, 49, 60, 70]
      }
    ],
    xaxis: {
      categories: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio']
    }
  };

  constructor(
    private ServicioClienteHttp: ClienthttpCongopeService
  ) {
    this.barChartOptions={};
    this.barChartOptions.series=[];
 //   this.barChartOptions.chart={};
  //  console.log("antes"+this.barChartOptions.series);
  //  console.log("antes"+this.barChartOptions.chart);
    this.inicializa().subscribe({
      next: (fila) => {
    // Bar chart chart 1
   // console.log("esta llegando");
    this.barChartOptions = {
      series: [
        {
          name: 'Codificado',
          data: //[44, 55, 57, 56, 61, 58, 63, 60, 66],
          fila.map((item: { codificado: any; }) => item.codificado), //[44, 55, 57, 56, 61, 58, 63, 60, 66],
        },
        {
          name: 'Devengado',
          data:// [76, 85, 101, 98, 87, 105, 91, 114, 94],
          fila.map((item: { devengado: any; }) => item.devengado),//[76, 85, 101, 98, 87, 105, 91, 114, 94],
        },
        {
          name: 'Diferencia',
          data: //[35, 41, 36, 26, 45, 48, 52, 53, 41],
          fila.map((item: { diferencia: any; }) => item.diferencia),//[35, 41, 36, 26, 45, 48, 52, 53, 41],
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: fila.map((item: { descripcion: any; }) => item.descripcion.substring(0,20)), 
        labels: {
          style: {
            colors: '#9aa0ac',
          },
        },
      },
      yaxis: {
        title: {
          text: '$ (Dólares)',
        },
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        theme: 'dark',
        marker: {
          show: true,
        },
        x: {
          show: true,
        },
      },
    };
  }
 });
// console.log("despues"+this.barChartOptions.series);
}
 /* ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }*/
  
    ngOnInit(): void {
      //this.constructor();
      //console.log("despues"+this.barChartOptions.series);
    //  console.log("despues"+this.barChartOptions.chart);
    //this.initMap();  
    this.initMap(); // Llamar al método para inicializar el mapa
    }
    
 public rutaapi: string = "EjecucionPresupuestaria?sFechaHasta=2024-11-26";
                          
    inicializa() { 
      return new Observable<any>((observer) => {

      //  console.log("SSSS"+this.rutaapi);
      this.ServicioClienteHttp.SeteoRuta(this.rutaapi);
      this.ServicioClienteHttp.Obtener_Lista().subscribe({
        next: (data: { success: any; result: string; message: any; }) => {
          if (data.success) {
            let resultado: any[] = JSON.parse(data.result);
            //console.log("ejecucion pres" + resultado);

            // Emitir el valor de 'fila' al observable
            observer.next(resultado);
           observer.complete();
          } else {
            this.alertas.MensajeError(data.message);
            observer.error(data.message); // En caso de que haya error, se emite un error al observable
          }
        },
        error: (err: { message: any; }) => {
          console.log(err.message);
         observer.error(err.message); // En caso de error en la solicitud HTTP
        }
      });
    });
  
  }

  initMap(): void {
   // Crear el mapa y configurarlo
const map = L.map('map').setView([-1.8312, -78.1835], 6);  // Coordenadas de Ecuador, con zoom 6
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Estilo para las provincias
const estiloDivisiones = {
  color: '#3388ff',   // Color del borde
  weight: 2,          // Grosor del borde
  opacity: 1,         // Opacidad del borde
  fillColor: '#66ccff',  // Color de relleno
  fillOpacity: 0.5    // Opacidad del relleno
};

// Cargar el archivo GeoJSON con la división política de Ecuador
fetch('assets/ecuador.geojson')
  .then(response => response.json())
  .then(data => {
    // Guardar las divisiones en una variable global
    const geojsonLayer = L.geoJSON(data, {
      style: estiloDivisiones
    }).addTo(map);
    // Manejar el evento de clic en el mapa
    map.on('click', (event: any) => {
   //   alert("event"+event.latlng);
      const { lat, lng } = event.latlng;

     
      // Verificar qué provincia se encuentra en las coordenadas del clic
      geojsonLayer.eachLayer((layer: any) => {   
          if (layer instanceof L.Polygon && layer.getBounds().contains(event.latlng)) {
          
             // Crear un marcador en el lugar donde el usuario hizo clic
            L.marker([lat, lng]).addTo(map)
        .bindPopup(layer.feature?.properties.nombre,)
        .openPopup();
            const provinceName = layer.feature?.properties.nombre; // Ajusta el nombre según tu archivo GeoJSON
          }
      });
    });
  })
  .catch(error => {
    console.error('Error al cargar el archivo GeoJSON:', error);
  });
  }

}
