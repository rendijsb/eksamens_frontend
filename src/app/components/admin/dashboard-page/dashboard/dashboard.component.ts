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
    revenueGrowth: number;
    totalOrders: number;
    monthlyOrders: number;
    ordersGrowth: number;
    totalUsers: number;
    newUsers: number;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    pendingOrders: number;
    completedOrders: number;
    averageOrderValue: number;
    totalCouponsUsed: number;
    totalReviews: number;
    pendingReviews: number;
    newsletterSubscribers: number;
  };
  salesData: {
    dailySales: Array<{ date: string; total: number; orders: number; average_order: number; }>;
    totalSales: number;
    totalOrders: number;
    averageDaily: number;
    salesByPaymentMethod: Array<{ payment_method: string; total: number; count: number; }>;
    salesByHour: Array<{ hour: number; total: number; orders: number; }>;
  };
  topProducts: Array<{
    name: string;
    slug: string;
    price: number;
    sale_price: number;
    stock: number;
    total_sold: number;
    revenue: number;
    avg_rating: number;
    review_count: number;
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
    total_products: number;
    avg_rating: number;
  }>;
  couponAnalytics: {
    totalCoupons: number;
    activeCoupons: number;
    usedCoupons: number;
    totalDiscountGiven: number;
    popularCoupons: Array<{ code: string; type: string; value: number; used_count: number; }>;
    couponUsageByMonth: Array<{ month: string; uses: number; total_discount: number; }>;
    couponConversionRate: number;
  };
  reviewAnalytics: {
    totalReviews: number;
    approvedReviews: number;
    pendingReviews: number;
    approvalRate: number;
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number; }>;
    categoryRatings: Array<{ name: string; avg_rating: number; review_count: number; }>;
    reviewsByMonth: Array<{ month: string; total_reviews: number; avg_rating: number; }>;
  };
  newsletterAnalytics: {
    totalSubscribers: number;
    activeSubscribers: number;
    unsubscribed: number;
    subscriptionRate: number;
    subscriptionGrowth: Array<{ month: string; new_subscribers: number; }>;
    unsubscriptionRate: Array<{ month: string; unsubscribers: number; }>;
  };
  cartAnalytics: {
    totalCarts: number;
    cartsWithItems: number;
    emptyCarts: number;
    abandonmentRate: number;
    conversionRate: number;
    averageCartValue: number;
    cartItemsByCategory: Array<{ name: string; total_quantity: number; total_value: number; }>;
  };
  inventoryAnalytics: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    productsOnSale: number;
    stockByCategory: Array<{ name: string; total_stock: number; product_count: number; avg_stock: number; }>;
    fastMovingProducts: Array<{ name: string; sold: number; stock: number; }>;
    slowMovingProducts: Array<{ name: string; sold: number; stock: number; }>;
    needRestock: Array<{ name: string; stock: number; sold: number; }>;
  };
  customerAnalytics: {
    totalCustomers: number;
    customersWithOrders: number;
    customersWithoutOrders: number;
    customerConversionRate: number;
    repeatCustomers: number;
    repeatCustomerRate: number;
    topCustomers: Array<{ id: number; name: string; email: string; total_spent: number; order_count: number; avg_order_value: number; }>;
    customersByMonth: Array<{ month: string; new_customers: number; }>;
  };
  productAnalytics: {
    totalWishlistItems: number;
    mostWishlisted: Array<{ name: string; wishlist_count: number; }>;
    wishlistConversionRate: number;
    productsWithSales: number;
    saleRevenuePercentage: number;
    productsByStatus: Array<{ status: string; count: number; }>;
  };
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
  @ViewChild('paymentMethodChart', { static: false }) paymentMethodChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('couponUsageChart', { static: false }) couponUsageChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ratingDistributionChart', { static: false }) ratingDistributionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cartAnalyticsChart', { static: false }) cartAnalyticsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wishlistConversionChart', { static: false }) wishlistConversionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourlyTrafficChart', { static: false }) hourlyTrafficChart!: ElementRef<HTMLCanvasElement>;

  dashboardData: WritableSignal<DashboardData | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(true);
  activeTab: WritableSignal<string> = signal('overview');

  private chartInstances: Map<string, Chart> = new Map();

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
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();

    this.createSalesChart();
    this.createUserGrowthChart();
    this.createPaymentMethodChart();
    this.createCouponUsageChart();
    this.createRatingDistributionChart();
    this.createCartAnalyticsChart();
    this.createWishlistConversionChart();
    this.createHourlyTrafficChart();
  }

  private createSalesChart(): void {
    if (!this.salesChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.salesChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const salesData = this.dashboardData()!.salesData.dailySales;

    const chart = new Chart(ctx, {
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
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pasūtījumi',
            data: salesData.map(item => item.orders),
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.4,
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
            text: 'Pārdošanas un pasūtījumi pa dienām'
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

    this.chartInstances.set('sales', chart);
  }

  private createUserGrowthChart(): void {
    if (!this.userGrowthChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.userGrowthChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const userGrowthData = this.dashboardData()!.userGrowth;

    const chart = new Chart(ctx, {
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

    this.chartInstances.set('userGrowth', chart);
  }

  private createPaymentMethodChart(): void {
    if (!this.paymentMethodChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.paymentMethodChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const paymentData = this.dashboardData()!.salesData.salesByPaymentMethod;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: paymentData.map(item => item.payment_method),
        datasets: [{
          label: 'Maksājumu metodes',
          data: paymentData.map(item => item.total),
          backgroundColor: [
            'rgba(139, 0, 0, 0.8)',
            'rgba(74, 144, 226, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(40, 167, 69, 0.8)',
            'rgba(220, 53, 69, 0.8)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Ieņēmumi pa maksājumu metodēm'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.chartInstances.set('paymentMethod', chart);
  }

  private createCouponUsageChart(): void {
    if (!this.couponUsageChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.couponUsageChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const couponData = this.dashboardData()!.couponAnalytics.couponUsageByMonth;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: couponData.map(item => {
          const [year, month] = item.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('lv-LV', { year: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'Kuponu izmantošana',
            data: couponData.map(item => item.uses),
            borderColor: '#B22222',
            backgroundColor: 'rgba(178, 34, 34, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Kopējā atlaide (€)',
            data: couponData.map(item => item.total_discount),
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.4,
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
            text: 'Kuponu izmantošana un atlaides'
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function(value) {
                return '€' + value;
              }
            }
          }
        }
      }
    });

    this.chartInstances.set('couponUsage', chart);
  }

  private createRatingDistributionChart(): void {
    if (!this.ratingDistributionChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.ratingDistributionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const ratingData = this.dashboardData()!.reviewAnalytics.ratingDistribution;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ratingData.map(item => `${item.rating} Zvaigznes`),
        datasets: [{
          label: 'Atsauksmju skaits',
          data: ratingData.map(item => item.count),
          backgroundColor: [
            'rgba(220, 53, 69, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(23, 162, 184, 0.8)',
            'rgba(40, 167, 69, 0.8)',
            'rgba(139, 0, 0, 0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Vērtējumu sadalījums'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    this.chartInstances.set('ratingDistribution', chart);
  }

  private createCartAnalyticsChart(): void {
    if (!this.cartAnalyticsChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.cartAnalyticsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const cartData = this.dashboardData()!.cartAnalytics;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pārvērsti pasūtījumos', 'Pamesti grozos'],
        datasets: [{
          label: 'Grozu analītika',
          data: [cartData.conversionRate, cartData.abandonmentRate],
          backgroundColor: [
            'rgba(40, 167, 69, 0.8)',
            'rgba(220, 53, 69, 0.8)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Grozu konversijas un pamešanas ātrums'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.chartInstances.set('cartAnalytics', chart);
  }

  private createWishlistConversionChart(): void {
    if (!this.wishlistConversionChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.wishlistConversionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const wishlistData = this.dashboardData()!.productAnalytics.mostWishlisted.slice(0, 5);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: wishlistData.map(item => item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name),
        datasets: [{
          label: 'Pievienots vēlmju sarakstā',
          data: wishlistData.map(item => item.wishlist_count),
          backgroundColor: 'rgba(139, 0, 0, 0.8)',
          borderColor: '#8B0000',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Populārākie produkti vēlmju sarakstā'
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });

    this.chartInstances.set('wishlistConversion', chart);
  }

  private createHourlyTrafficChart(): void {
    if (!this.hourlyTrafficChart?.nativeElement || !this.dashboardData()) return;

    const ctx = this.hourlyTrafficChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const hourlyData = this.dashboardData()!.salesData.salesByHour;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hourlyData.map(item => `${item.hour}:00`),
        datasets: [{
          label: 'Pasūtījumi pa stundām',
          data: hourlyData.map(item => item.orders),
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Pasūtījumu sadalījums pa diennakts stundām'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    this.chartInstances.set('hourlyTraffic', chart);
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    setTimeout(() => {
      this.createCharts();
    }, 100);
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

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }
}
