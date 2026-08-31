import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { StatsWidget } from '@/app/pages/dashboards/ecommerce/components/statswidget';
import { TopProductsWidget } from '@/app/pages/dashboards/ecommerce/components/topproductswidget';
import { TrafficWidget } from '@/app/pages/dashboards/ecommerce/components/trafficwidget';
import { LeaderBoardWidget } from '@/app/pages/dashboards/ecommerce/components/leaderboardwidget';
import { ProductListWidget } from '@/app/pages/dashboards/ecommerce/components/productlistwidget';
import { SellersWidget } from '@/app/pages/dashboards/ecommerce/components/sellerswidget';

@Component({
    selector: 'app-ecommerce-dashboard',
    standalone: true,
    imports: [CommonModule, TagModule, StatsWidget, TopProductsWidget, TrafficWidget, LeaderBoardWidget, ProductListWidget, SellersWidget],
    template: ` <div class="flex flex-col gap-6">
        <stats-widget />
        <div class="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
            <top-products-widget />
            <traffic-widget />
        </div>
        <div class="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
            <leader-board-widget />
            <product-list-widget />
            <sellers-widget />
        </div>
    </div>`
})
export class EcommerceDashboard {}
