import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Product } from 'src/app/products/interfaces/product.interface';
import { ProductsCarouselComponent } from '@products/components/products-carousel/products-carousel.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@utils/form-utils';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { ProductsService } from '@products/services/products.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [
    ProductsCarouselComponent,
    ReactiveFormsModule,
    FormErrorLabelComponent,
  ],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  product = input.required<Product>();

  fb = inject(FormBuilder);

  router = inject(Router);

  productService = inject(ProductsService);

  wasSaved = signal(false);

  tmpImages = signal<string[]>([]);

  imageFileList: FileList | undefined = undefined;

  imagesToCarousel = computed(() => {
    const currentProductImages = [
      ...this.product().images,
      ...this.tmpImages(),
    ];

    return currentProductImages;
  });

  productForm = this.fb.group({
    title: ['', Validators.required],
    slug: [
      '',
      [Validators.required, Validators.pattern(FormUtils.slugPattern)],
    ],
    description: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0)]],
    stock: ['', [Validators.required, Validators.min(0)]],
    tags: [''],
    gender: [
      'men',
      [Validators.required, Validators.pattern(/men|women|kid|unisex/)],
    ],
    sizes: [['']],
    images: [['']],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  //la parte del OnInit es para que al cargar la pagina, el formulario se resetea y se le asigna
  // los valores que traemos por la peticion htttp
  // algunos valores no coinciden entonces por eso se le agrega el tipo any para que haga lo que pueda
  ngOnInit(): void {
    this.setFormValue(this.product());
  }

  //esto es porque los tags debe de ser un string[] pero en el formulario se maneja como strings
  setFormValue(formLike: Partial<Product>) {
    this.productForm.reset(this.product() as any);
    // this.productForm.patchValue(formLike as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(',') });
  }

  onSizesClicked(size: string) {
    const currentSizes = this.productForm.value.sizes ?? [];

    // esto es para remover si la talla es quitada con el click
    // entonces se busca en nuestro arreglo y si la haya entonces la remueve
    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      // pero entonces si no existe en nuestro arreglo, se agrega esa talla
      currentSizes.push(size);
    }

    // ahora actualizamos nuestro formulario
    this.productForm.patchValue({ sizes: currentSizes });
  }

  async onSubmit() {
    const isValid = this.productForm.valid;

    this.productForm.markAsTouched();

    if (!isValid) return;

    const formValue = this.productForm.value;

    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags:
        formValue.tags
          ?.toLowerCase()
          .split(',')
          .map((tag) => tag.trim()) ?? [],
    };

    if (this.product().id == 'new') {
      // crear producto
      const product = await firstValueFrom(
        this.productService.createProduct(productLike, this.imageFileList)
      );

      // en esta parte el back nos devuelve el producto con el nuevo id
      // entonces navegamos para que en vez de crear uno nuevo, ahora
      // estemos en la pantalla de actualizar
      this.router.navigate(['/admin/products', product.id]);
    } else {
      await firstValueFrom(
        this.productService.updateProduct(
          this.product().id,
          productLike,
          this.imageFileList
        )
      );
    }

    this.wasSaved.set(true);
    setTimeout(() => {
      this.wasSaved.set(false);
    }, 3000);
  }

  // images
  onFilesChanged(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;

    this.imageFileList = fileList ?? undefined;

    // esta parte es para poder generar un url temp para las imagenes
    // y poder mostrarlas en pantalla
    const imageUrls = Array.from(fileList ?? []).map((file) =>
      URL.createObjectURL(file)
    );

    this.tmpImages.set(imageUrls);
  }
}
