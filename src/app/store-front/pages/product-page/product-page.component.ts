import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ProductsService } from 'src/app/products/services/products.service';
import { ProductsCarouselComponent } from '../../../products/components/products-carousel/products-carousel.component';

@Component({
  selector: 'app-product-page',
  imports: [ProductsCarouselComponent],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent {
  private productService = inject(ProductsService);

  activatedRoute = inject(ActivatedRoute);

  productIdSlug: string = this.activatedRoute.snapshot.params['idSlug'];

  productResource = rxResource({
    request: () => ({ idSlug: this.productIdSlug }),
    loader: ({ request }) => {
      return this.productService.getProductByIdSlug(request.idSlug);
    },
  });
}
