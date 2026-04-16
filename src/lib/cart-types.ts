export type CartLine = {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type CartPayload = {
  id: string;
  reference: string;
  totalCents: number;
  items: CartLine[];
};
