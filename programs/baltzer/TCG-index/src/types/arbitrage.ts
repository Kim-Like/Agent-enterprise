export interface ArbitrageOpportunity {
  id: string;
  cardName: string;
  set: string;
  rarity: string;
  condition: string;
  buyPrice: number;
  buyMarket: string;
  sellPrice: number;
  sellMarket: string;
  profitMargin: number;
  netProfit: number;
  imageUrl?: string;
  lastUpdated: Date;
}
