export type Region = 'middle-east' | 'africa' | 'asia' | 'europe' | 'americas' | 'oceania';
type C = { id: string; name: string; region: Region };
const r = (region: Region, list: [string, string][]): C[] => list.map(([id, name]) => ({ id, name, region }));

// Draft list — owner confirms. ids are ISO 3166-1 numeric (matches world-atlas).
export const servedCountries: C[] = [
  ...r('middle-east', [['784','United Arab Emirates'],['682','Saudi Arabia'],['512','Oman'],['634','Qatar'],['414','Kuwait'],['048','Bahrain'],['364','Iran'],['368','Iraq'],['400','Jordan'],['376','Israel'],['792','Türkiye'],['818','Egypt'],['887','Yemen']]),
  ...r('africa', [['686','Senegal'],['384',"Côte d'Ivoire"],['204','Benin'],['768','Togo'],['288','Ghana'],['566','Nigeria'],['324','Guinea'],['270','Gambia'],['694','Sierra Leone'],['430','Liberia'],['466','Mali'],['854','Burkina Faso'],['120','Cameroon'],['266','Gabon'],['180','DR Congo'],['178','Congo'],['024','Angola'],['508','Mozambique'],['450','Madagascar'],['404','Kenya'],['834','Tanzania'],['800','Uganda'],['231','Ethiopia'],['262','Djibouti'],['706','Somalia'],['710','South Africa'],['480','Mauritius'],['504','Morocco'],['012','Algeria'],['788','Tunisia'],['434','Libya'],['729','Sudan']]),
  ...r('asia', [['050','Bangladesh'],['524','Nepal'],['144','Sri Lanka'],['462','Maldives'],['104','Myanmar'],['764','Thailand'],['704','Vietnam'],['458','Malaysia'],['702','Singapore'],['360','Indonesia'],['608','Philippines'],['156','China'],['344','Hong Kong'],['392','Japan'],['410','South Korea'],['004','Afghanistan'],['398','Kazakhstan'],['860','Uzbekistan'],['643','Russia']]),
  ...r('europe', [['826','United Kingdom'],['276','Germany'],['528','Netherlands'],['056','Belgium'],['250','France'],['380','Italy'],['724','Spain'],['616','Poland']]),
  ...r('americas', [['840','United States'],['124','Canada'],['484','Mexico'],['076','Brazil'],['170','Colombia'],['604','Peru'],['152','Chile']]),
  ...r('oceania', [['036','Australia'],['554','New Zealand']]),
];

export const routeHubs = [
  { name: 'Dubai', lon: 55.27, lat: 25.2 },
  { name: 'Jeddah', lon: 39.17, lat: 21.54 },
  { name: 'Dakar', lon: -17.45, lat: 14.69 },
  { name: 'Lagos', lon: 3.38, lat: 6.52 },
  { name: 'Mombasa', lon: 39.67, lat: -4.04 },
  { name: 'Durban', lon: 31.03, lat: -29.86 },
  { name: 'Rotterdam', lon: 4.48, lat: 51.92 },
  { name: 'New York', lon: -74.0, lat: 40.71 },
  { name: 'Santos', lon: -46.33, lat: -23.96 },
  { name: 'Shanghai', lon: 121.47, lat: 31.23 },
  { name: 'Jakarta', lon: 106.85, lat: -6.21 },
  { name: 'Sydney', lon: 151.21, lat: -33.87 },
  { name: 'Novorossiysk', lon: 37.77, lat: 44.72 },
];
