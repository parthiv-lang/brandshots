export const endpoints = {
  auth: {
    google: '/auth/google',
    apple: '/auth/apple',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  brands: {
    list: '/brands',
    scrape: '/brands/scrape',
    byId: (id: string) => `/brands/${id}`,
  },
  generations: {
    list: '/generations',
    byId: (id: string) => `/generations/${id}`,
    generate: '/generate',
  },
  products: {
    bgRemove: '/bg-remove',
    analyze: '/analyze',
    create: '/products',
    byId: (id: string) => `/products/${id}`,
  },
} as const;
