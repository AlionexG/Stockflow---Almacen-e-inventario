/**
 * Compresses an image file (from camera or file picker) to a lightweight DataURL
 * with optimal dimensions (max 600px width/height) and JPEG compression.
 */
export async function compressImageFile(file: File, maxWidth = 600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG for high compression ratio
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

/**
 * Curated preset catalog images to quickly assign if camera is not handy
 */
export const SAMPLE_PRODUCT_IMAGES = [
  {
    name: 'Auriculares Inalámbricos Pro',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    category: 'Electrónica',
  },
  {
    name: 'Smartwatch Deportivo',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    category: 'Electrónica',
  },
  {
    name: 'Zapatillas Urbanas',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
    category: 'Calzado',
  },
  {
    name: 'Mochila Impermeable Viaje',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    category: 'Accesorios',
  },
  {
    name: 'Botella Térmica de Acero 1L',
    url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80',
    category: 'Hogar',
  },
  {
    name: 'Lámpara LED de Escritorio',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
    category: 'Hogar',
  },
  {
    name: 'Funda Protectora iPhone/Android',
    url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&auto=format&fit=crop&q=80',
    category: 'Accesorios',
  },
  {
    name: 'Cámara Portátil HD',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
    category: 'Electrónica',
  },
];
