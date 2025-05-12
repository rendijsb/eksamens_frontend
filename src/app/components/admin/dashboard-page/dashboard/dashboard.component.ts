import { Component, OnInit, signal, WritableSignal, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiUrlService } from '../../../../shared/services/api.service';
import { catchError, EMPTY, tap, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import Chart from 'chart.js/auto';

interface DashboardData {
  overview: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
    monthlyOrders: number;
    totalUsers: number;
    newUsers: number;
    totalProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
    completedOrders: number;
  };
  salesData: {
    dailySales: Array<{ date: string; total: number; orders: number; }>;
    totalSales: number;
    totalOrders: number;
    averageDaily: number;
  };
  topProducts: Array<{
    name: string;
    slug: string;
    total_sold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    items_count: number;
  }>;
  userGrowth: Array<{ month: string; users: number; }>;
  categoryPerformance: Array<{
    name: string;
    revenue: number;
    items_sold: number;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastr = inject(ToastrService);

  @ViewChild('salesChart', { static: false }) salesChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('userGrowthChart', { static: false }) userGrowthChart!: ElementRef<HTMLCanvasElement>;

  dashboardData: WritableSignal<DashboardData | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(true);
  selectedPeriod: WritableSignal<string> = signal('30');

  private salesChartInstance: Chart | null = null;
  private userGrowthChartInstance: Chart | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    if (this.dashboardData()) {
      this.createCharts();
    }
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.http.get<{ data: DashboardData }>(
      this.apiUrlService.getUrl('api/admin/analytics/dashboard')
    ).pipe(
      tap(response => {
        this.dashboardData.set(response.data);
        setTimeout(() => {
          this.createCharts();
        }, 0);
      }),
      catchError(error => {
        this.toastr.error('Neizdevās ielādēt dashboard datus');
        console.error('Dashboard error:', error);
        return EMPTY;
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  private createCharts(): void {
    if (this.salesChart && this.dashboardData()) {
      this.createSalesChart();
    }
    if (this.userGrowthChart && this.dashboardData()) {
      this.createUserGrowthChart();
    }
  }

  private createSalesChart(): void {
    if (!this.salesChart?.nativeElement || !this.dashboardData()) return;

    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    const ctx = this.salesChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const salesData = this.dashboardData()!.salesData.dailySales;

    this.salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('lv-LV', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Ieņēmumi (€)',
            data: salesData.map(item => parseFloat(item.total.toString())),
            borderColor: '#8B0000',
            backgroundColor: 'rgba(139, 0, 0, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Pasūtījumi',
            data: salesData.map(item => item.orders),
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Pārdošanas pēdējās 30 dienās'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '€' + value;
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
  }

  private createUserGrowthChart(): void {
    if (!this.userGrowthChart?.nativeElement || !this.dashboardData()) return;

    if (this.userGrowthChartInstance) {
      this.userGrowthChartInstance.destroy();
    }

    const ctx = this.userGrowthChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const userGrowthData = this.dashboardData()!.userGrowth;

    this.userGrowthChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: userGrowthData.map(item => {
          const [year, month] = item.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('lv-LV', { year: 'numeric', month: 'short' });
        }),
        datasets: [{
          label: 'Jauni lietotāji',
          data: userGrowthData.map(item => item.users),
          backgroundColor: 'rgba(139, 0, 0, 0.8)',
          borderColor: '#8B0000',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Jauno lietotāju skaits pa mēnešiem'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  getChangePercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'failed': return 'status-failed';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Pabeigts';
      case 'processing': return 'Apstrādē';
      case 'pending': return 'Gaida';
      case 'cancelled': return 'Atcelts';
      case 'failed': return 'Neizdevās';
      default: return status;
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('lv-LV', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
