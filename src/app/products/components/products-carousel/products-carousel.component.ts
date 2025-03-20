import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnChanges,
  SimpleChanges,
  viewChild,
} from '@angular/core';

import Swiper from 'swiper';

import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ProductImagePipe } from '../../pipes/product-image.pipe';

@Component({
  selector: 'products-carousel',
  imports: [ProductImagePipe],
  templateUrl: './products-carousel.component.html',
  styles: `

  .swiper {
    width: 100%;
    height: 500px;

  }

  `,
})
export class ProductsCarouselComponent implements AfterViewInit, OnChanges {
  images = input.required<string[]>();

  swiperDiv = viewChild.required<ElementRef>('swiperDiv');

  swiper: Swiper | undefined = undefined;

  ngAfterViewInit() {
    this.swiperInit();
  }

  //este codigo es porque se añadio la funcion de que al cargar una imagen
  // tambien se pueda ver en el carousel sin necesidad de haberla subido al back
  // entonces se agrega el OnChanges y todo el codigo de abajo para saber si hay cambios o no
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'].firstChange) return;

    if (!this.swiper) return;

    this.swiper.destroy(true, true);

    // siguientes lineas son solo para arreglar los puntitos que aparecen en
    // la paginacion del carousel

    const paginationEl: HTMLDivElement =
      this.swiperDiv().nativeElement?.querySelector('.swiper-pagination');

    paginationEl.innerHTML = '';

    setTimeout(() => {
      this.swiperInit();
    }, 100);
  }

  swiperInit() {
    const element = this.swiperDiv().nativeElement;

    if (!element) return;

    this.swiper = new Swiper(element, {
      // Optional parameters
      direction: 'horizontal',
      loop: true,

      modules: [Navigation, Pagination],

      // If we need pagination
      pagination: {
        el: '.swiper-pagination',
      },

      // Navigation arrows
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // And if we need scrollbar
      scrollbar: {
        el: '.swiper-scrollbar',
      },
    });
  }
}
