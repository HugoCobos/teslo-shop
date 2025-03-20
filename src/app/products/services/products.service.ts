import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Gender,
  Product,
  ProductsResponse,
} from '../interfaces/product.interface';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import type { User } from '@auth/interfaces/user.interface';

const baseUrl = environment.baseURl;

interface Options {
  limit?: number;
  offset?: number;
  gender?: string;
}

// esta parte es para crear nuevos productos ya que reutilizamos la pantalla
// de actualizar producto
const emptyProduct: Product = {
  id: 'new',
  title: '',
  price: 0,
  description: '',
  slug: '',
  stock: 0,
  sizes: [],
  gender: Gender.Men,
  tags: [],
  images: [],
  user: {} as User,
};

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);

  private productsCache = new Map<string, ProductsResponse>();

  private productCache = new Map<string, Product>();

  getProducts(options: Options): Observable<ProductsResponse> {
    const { limit = 9, offset = 0, gender = '' } = options;

    const key = `${limit}-${offset}-${gender}`; //9-0+''

    if (this.productsCache.has(key)) {
      // se debe almacenar de tipo ProductsResponse ya que necesitamos pagina, offset y productos
      return of(this.productsCache.get(key)!);
    }

    return this.http
      .get<ProductsResponse>(`${baseUrl}/products`, {
        params: {
          limit,
          offset,
          gender,
        },
      })
      .pipe(
        // tap((resp) => console.log(resp)),
        tap((resp) => this.productsCache.set(key, resp))
      );
  }

  getProductByIdSlug(idSlug: string): Observable<Product> {
    if (this.productCache.has(idSlug)) {
      return of(this.productCache.get(idSlug)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${idSlug}`).pipe(
      tap((resp) => console.log(resp)),
      tap((resp) => this.productCache.set(idSlug, resp))
    );
  }

  getProductById(id: string): Observable<Product> {
    if (id == 'new') {
      return of(emptyProduct);
    }

    if (this.productCache.has(id)) {
      return of(this.productCache.get(id)!);
    }

    return this.http
      .get<Product>(`${baseUrl}/products/${id}`)
      .pipe(tap((resp) => this.productCache.set(id, resp)));
  }

  updateProduct(
    id: string,
    productLike: Partial<Product>,
    imageFileList?: FileList
  ): Observable<Product> {
    const currentImages = productLike.images ?? [];

    return this.uploadImages(imageFileList).pipe(
      // primero cargamos las imagenes
      map((imageNames) => ({
        ...productLike,
        images: [...currentImages, ...imageNames],
      })),
      // si todo sale bien entonces actualizamos el producto
      switchMap((updateProduct) =>
        this.http.patch<Product>(`${baseUrl}/products/${id}`, updateProduct)
      ),
      // si todo sale bien entonces actualizamos el cache
      tap((product) => this.updateProductCache(product))
    );
  }

  createProduct(
    productLike: Partial<Product>,
    imageFileList?: FileList
  ): Observable<Product> {
    const currentImages = productLike.images ?? [];

    return this.uploadImages(imageFileList).pipe(
      // primero cargamos las imagenes
      map((imageNames) => ({
        ...productLike,
        images: [...currentImages, ...imageNames],
      })),
      // si todo sale bien entonces actualizamos el producto
      switchMap((updateProduct) =>
        this.http.post<Product>(`${baseUrl}/products`, updateProduct)
      ),
      // si todo sale bien entonces actualizamos el cache
      tap((product) => this.updateProductCache(product))
    );
  }

  updateProductCache(product: Product) {
    const productId = product.id;

    this.productCache.set(productId, product);

    // buscamos en nuestro mapa todos los caches que hay
    this.productsCache.forEach((productResponse) => {
      // hacemos el barrido de cada uno de los productos hasta buscar el que coincida
      productResponse.products = productResponse.products.map(
        (currentProduct) =>
          currentProduct.id == productId ? product : currentProduct
      );
    });

    console.log('cache actualizado');
  }

  uploadImages(images?: FileList): Observable<string[]> {
    if (!images) return of([]);

    const uploadObsevables = Array.from(images).map((imageFile) =>
      this.uploadImage(imageFile)
    );

    return forkJoin(uploadObsevables).pipe(
      tap((imageNames) => console.log(imageNames))
    );
  }

  uploadImage(imageFile: File): Observable<string> {
    const formData = new FormData();

    formData.append('file', imageFile);

    return this.http
      .post<{ fileName: string }>(`${baseUrl}/files/product`, formData)
      .pipe(map((resp) => resp.fileName));
  }
}
